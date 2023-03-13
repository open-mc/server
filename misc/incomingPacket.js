import { BlockIDs, Blocks } from '../blocks/block.js'
import { chat, prefix } from './chat.js'
import { anyone_help, commands, err, mod_help } from './commands.js'
import { MOD, TPS } from '../config.js'
import { Entities, entityMap } from '../entities/entity.js'
import { DataWriter } from '../utils/data.js'
import { blockevent, cancelblockevent, down, getX, getY, goto, jump, left, peek, peekdown, peekleft, peekright, peekup, place, placeat, right, up } from './ant.js'

const REACH = 10

function playerMovePacket(player, buf){
	top: {
		let t = Date.now()
		if(t < (t = max(this.movePacketCd + 1000 / TPS, t - 2000)))break top
		this.movePacketCd = t
		if(buf.byte() != this.r || !player.chunk)break top
		player.move(buf.double() || 0, buf.double() || 0)
		player.state = buf.short()
		player.dx = buf.float() || 0; player.dy = buf.float() || 0
		const sel = buf.byte()
		if(player.selected != (player.selected = (sel & 127) % 9)){
			const res = new DataWriter()
			res.byte(15)
			res.uint32(player._id); res.short(player._id / 4294967296 | 0)
			res.byte(player.selected)
			player.emit(res)
		}
		const x = buf.float(), y = buf.float()
		if(x != x){ player.f = y || 0; break top }
		const bx = floor(player.x) | 0, by = floor(player.y + player.head) | 0
		goto(bx, by, player.world)
		const reach = sqrt(x * x + y * y)
		let d = 0, px = ifloat(player.x - bx), py = ifloat(player.y + player.head - by)
		const dx = x / reach, dy = y / reach
		let l = 0
		while(d < reach){
			if(peek().solid)break
			if(dx > 0){
				const iy = py + dy * (1 - px) / dx
				if(iy >= 0 && iy <= 1){right(); l=65535; d += (1 - px) / dx; px = 0; py = iy; continue}
			}else if(dx < 0){
				const iy = py + dy * -px / dx
				if(iy >= 0 && iy <= 1){left(); l=1; d += -px / dx; px = 1; py = iy; continue}
			}
			if(dy > 0){
				const ix = px + dx * (1 - py) / dy
				if(ix >= 0 && ix <= 1){up(); l=-65536; d += (1 - py) / dy; py = 0; px = ix; continue}
			}else if(dy < 0){
				const ix = px + dx * -py / dy
				if(ix >= 0 && ix <= 1){down(); l=65536; d += -py / dy; py = 1; px = ix; continue}
			}
			//failsafe
			break top
		}
		if(sel > 127){
			if(d >= reach) break top
			const block = peek(), item = player.inv[sel & 127]
			if(block.solid){
				if(!player.blockBreakEvent || player.bx != (player.bx = getX()) || player.by != (player.by = getY())){
					if(player.blockBreakEvent)
						cancelblockevent(player.blockBreakEvent)
					player.blockBreakProgress = 0, player.blockBreakEvent = blockevent(1)
				}
				return
			}
			if(item && item.interact2){
				item.interact2(player)
				if(!item.count) player.inv[sel&127] = null
				player.itemschanged([sel & 127])
			}
			break top
		}
		let b = peek()
		const item = player.inv[sel]
		if(b.solid){
			if(item && item.interact){
				item.interact(b)
				if(!item.count) player.inv[sel] = null
				player.itemschanged([sel])
				return
			}
			if(!l) break top
		}
		if(!item) break top
		jump(l << 16 >> 16, l >> 16)
		if(!peekup().solid && !peekleft().solid && !peekdown().solid && !peekright().solid) break top
		b = peek()
		{
			const x = getX(), y = getY()
			if(x < player.x + player.width && x + 1 > player.x - player.width && y < player.y + player.height && y + 1 > player.y) break top
		}
		item.place?.()
		if(!item.count) player.inv[sel&127] = null
		player.itemschanged([sel&127])
	}
	if(player.blockBreakEvent){
		cancelblockevent(player.blockBreakEvent)
		player.blockBreakEvent = 0
		player.blockBreakProgress = -1
	}
}


function openContainerPacket(player, buf){
	if(player.interface) return
	const x = buf.int(), y = buf.int()
	player.world.at(x, y, player)
}
function openEntityPacket(player, buf){
	if(player.interface) return
	const e = entityMap.get(buf.uint32() + buf.short() * 4294967296)
	const dx = e.x - player.x, dy = e.y - player.y
	if(dx * dx + dy * dy > (REACH + 2) * REACH || !e.chunk.players.includes(player)) return
	player.interface = e
	player.interfaceId = 0
	const res = new DataWriter()
	res.byte(13)
	res.uint32(e._id); res.short(e._id / 4294967296 | 0)
	res.byte(0)
	res.pipe(player.sock)
}
function inventoryPacket(player, buf){
	// Clicked on a slot in their inventory
	if(!player.interface) return
	let slot = buf.byte()
	let changed = 0
	if(slot > 127){
		slot &= 127
		if(!player.interface.items) return
		const {items} = player.interface
		if(slot >= items.length) return
		const t = items[slot], h = player.inv[36]
		if(!t && !h) return
		if(t && !h) player.inv[36] = t, items[slot] = null, changed |= 3
		else if(h && !t) items[slot] = h, player.inv[36] = null, changed |= 3
		else if(h && t && h.constructor == t.constructor && !h.savedata){
			const add = min(h.count, t.maxStack - t.count)
			if(!(h.count -= add))player.inv[36] = null, changed |= 1
			t.count += add
			changed |= 2
		}else items[slot] = h, player.inv[36] = t, changed |= 3
		if(changed)
			player.itemschanged(changed & 1 ? changed & 2 ? [slot | 128, 36] : [36] : [slot | 128])
		return
	}
	if(slot >= player.inv.length) return
	const t = player.inv[slot], h = player.inv[36]
	if(!t && !h) return
	if(t && !h) player.inv[36] = t, player.inv[slot] = null, changed |= 3
	else if(h && !t) player.inv[slot] = h, player.inv[36] = null, changed |= 3
	else if(h && t && h.constructor == t.constructor && !h.savedata){
		const add = min(h.count, t.maxStack - t.count)
		if(!(h.count -= add))player.inv[36] = null, changed |= 1
		t.count += add
		changed |= 2
	}else player.inv[slot] = h, player.inv[36] = t, changed |= 3
	if(!changed) return
	player.itemschanged(changed & 1 ? changed & 2 ? [36, slot] : [36] : [slot])
}

function altInventoryPacket(player, buf){
	// Right-clicked on a slot in their inventory
	if(!player.interface) return
	let slot = buf.byte()
	if(slot > 127){
		slot &= 127
		if(!player.interface.items) return
		const {items} = player.interface
		if(slot >= items.length) return
		const t = items[slot], h = player.inv[36]
		if(t && !h){
			player.inv[36] = t.constructor(t.count - (t.count >>= 1))
			if(!t.count)items[slot] = null
		}else if(h && !t){
			items[slot] = h.constructor(1)
			if(!--h.count)player.inv[36] = null
		}else if(h && t && h.constructor == t.constructor && !h.savedata && t.count < t.maxStack){
			t.count++
			if(!--h.count)player.inv[36] = null
		}else items[slot] = h, player.inv[36] = t
		player.itemschanged([36])
		player.interface.itemschanged([slot | 128])
		return
	}
	if(slot >= player.inv.length) return
	const t = player.inv[slot], h = player.inv[36]
	if(t && !h){
		player.inv[36] = t.constructor(t.count - (t.count >>= 1))
		if(!t.count)player.inv[slot] = null
	}else if(h && !t){
		player.inv[slot] = h.constructor(1)
		if(!--h.count)player.inv[36] = null
	}else if(h && t && h.constructor == t.constructor && !h.savedata && t.count < t.maxStack){
		t.count++
		if(!--h.count)player.inv[36] = null
	}else player.inv[slot] = h, player.inv[36] = t
	player.itemschanged([36, slot])
}

function dropItemPacket(player, buf){
	if(!player.inv[player.selected]) return
	const e = Entities.item(player.x, player.y + player.head - 0.5)
	e.item = player.inv[player.selected]
	e.dx = player.f > 0 ? 7 : -7
	e.place(player.world)
	player.inv[player.selected] = null
	player.itemschanged([player.selected])
}

export const codes = Object.assign(new Array(256), {
	4: playerMovePacket,
	12: openContainerPacket,
	13: openEntityPacket,
	15(player, _){player.interface = null},
	32: inventoryPacket,
	33: altInventoryPacket,
	34: dropItemPacket
})
export function onstring(player, text){
	if(!(text = text.trimEnd())) return
	if(text[0] == '/'){
		try{
			let args = text.slice(1).match(/"(?:[^\\"]|\\.)*"|[^"\s]\S*|"/g).map((a,i)=>{
				try{return a[0]=='"'?JSON.parse(a):a}catch(e){throw 'Failed parsing argument '+i}
			})
			if(!(args[0] in commands))throw 'No such command: /'+args[0]
			if(this.permissions < MOD){
				if(!anyone_help[args[0]])throw "You do not have permission to use /"+args[0]
			}else if(player.permission == MOD && !mod_help[args[0]])throw "You do not have permission to use /"+args[0]
			let res = commands[args[0]].apply(player, args.slice(1))
			res && player.chat(res)
		}catch(e){
			player.chat(err(e), 9)
		}
	}else chat(prefix(player)+text)
}
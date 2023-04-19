import { chat, prefix } from './chat.js'
import { anyone_help, commands, err, mod_help } from './commands.js'
import { CONFIG, MOD, stat, statRecord } from '../config.js'
import { DX, DY, Entities, X, Y, entityMap } from '../entities/entity.js'
import { DataWriter } from '../utils/data.js'
import { gridevent, cancelgridevent, down, getX, getY, goto, jump, left, peek, peekdown, peekleft, peekright, peekup, right, up } from './ant.js'
import { current_tps } from '../world/tick.js'
import { stepEntity } from '../world/physics.js'
import { players } from '../world/index.js'

const REACH = 10

/*function withinD(incoming, old, target){
	const ratio = incoming / old
	if(ratio > 0 && ratio < 1) return true
	const ratio2 = incoming / target
	return ratio2 > 0 && ratio2 < 1
}
function withinDa(incoming, target){
	const ratio2 = incoming / target
	return ratio2 > 0 && ratio2 < 1.25
}*/

function validateMove(sock, player, buf){
	// where the player wants to be
	const x = buf.double() || 0, y = buf.double() || 0
	player.state = buf.short(); let rubber = false
	//const dx = buf.float() || 0, dy = buf.float() || 0

	// where the player was
	const {x: ox, y: oy, dx, dy} = player
	
	let mx = ifloat(x - ox), my = ifloat(y - oy)
	if(mx >= 0){
		const excess = mx - max(9, dx) / current_tps
		sock.rx -= excess
		if(sock.rx < 0){
			mx += sock.rx
			sock.rx = 0
			rubber = true
		}else if(sock.rx > 10) sock.rx = 10
	}else{
		const excess = mx - min(-9, dx) / current_tps
		sock.rx += excess
		if(sock.rx < 0){
			mx -= sock.rx
			sock.rx = 0
			rubber = true
		}else if(sock.rx > 10) sock.rx = 10
	}
	if(my >= 0){
		const excess = my - max(9, dy) / current_tps
		sock.ry -= excess
		if(sock.ry < 0){
			my += sock.ry
			sock.ry = 0
			rubber = true
		}else if(sock.ry > 10) sock.ry = 10
	}else{
		const tV = player.world.gy * player.gy / (1 - player.yDrag)
		const excess = my - min(tV * 1.2, dy) / current_tps
		sock.ry += excess
		if(sock.ry < 0){
			my -= sock.ry
			sock.ry = 0
			rubber = true
		}else if(sock.ry > 10) sock.ry = 10
	}
	if(!rubber){
		player.dx = mx * current_tps
		player.dy = my * current_tps
		stepEntity(player)
	}else player.rubber()

	/*if(rubber)return void player.rubber()

	if(abs(dx) < 9 || withinD(dx, odx, player.dx))player.dx = dx
	else rubber = true

	if((dy / tV < 1 && (tV > 0 || dy < 10)) || withinD(dy, ody, player.dy))player.dy = dy
	else rubber = true*/
}

function playerMovePacket(player, buf){
	top: {
		let t = Date.now() / 1000
		if(t < (t = max(this.movePacketCd + 1 / current_tps, t - 2))) return
		this.movePacketCd = t
		if(buf.byte() != this.r || !player.chunk) return

		validateMove(this, player, buf)
		
		statRecord('player', 'max_speed', Math.sqrt(player.dx * player.dx + player.dy * player.dy))
		statRecord('player', 'max_dist', Math.sqrt(player.x * player.x + player.y * player.y))
		const sel = buf.byte()
		if(player.selected != (player.selected = (sel & 127) % 9)){
			const res = new DataWriter()
			res.byte(15)
			res.uint32(player._id); res.short(player._id / 4294967296 | 0)
			res.byte(player.selected)
			player.emit(res)
		}
		const x = buf.float(), y = buf.float()
		if(x != x){
			player.f = y || 0
			const e = entityMap.get(buf.uint32() + buf.short() * 4294967296)
			if(e && e != player && (e.x - player.x) * (e.x - player.x) + (e.y - player.y) * (e.y - player.y) <= (REACH + 2) * REACH && e.chunk.players.includes(player)){
				//hit e
				const itm = player.inv[player.selected]
				e.damage?.(itm?.damage?.(e) ?? 1, player)
			}
			break top
		}
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
				console.log(getX(), getY(), player.breakGridEvent)
				if(!player.breakGridEvent | player.bx != (player.bx = getX()) | player.by != (player.by = getY())){
					if(player.breakGridEvent)
						cancelgridevent(player.breakGridEvent)
					player.blockBreakLeft = round((item ? item.breaktime(block) : block.breaktime) * current_tps)
					player.breakGridEvent = gridevent(1, buf => buf.float(player.blockBreakLeft))
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
		if(item.place){
			item.place()
			stat('player', 'blocks_placed')
		}
		if(!item.count) player.inv[sel&127] = null
		player.itemschanged([sel&127])
	}
	if(player.breakGridEvent){
		cancelgridevent(player.breakGridEvent)
		player.breakGridEvent = 0
		player.blockBreakLeft = -1
		stat('player', 'break_abandon')
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
		if(!player.interface.items || slot == 128) return
		const {items} = player.interface
		if(slot >= items.length) return
		const t = items[slot], h = player.items[0]
		if(!t && !h) return
		if(t && !h) player.items[0] = t, items[slot] = null, changed |= 3
		else if(h && !t) items[slot] = h, player.items[0] = null, changed |= 3
		else if(h && t && h.constructor == t.constructor && !h.savedata){
			const add = min(h.count, t.maxStack - t.count)
			if(!(h.count -= add))player.items[0] = null, changed |= 1
			t.count += add
			changed |= 2
		}else items[slot] = h, player.items[0] = t, changed |= 3
		if(changed)
			player.itemschanged(changed & 1 ? changed & 2 ? [slot | 128, 128] : [128] : [slot | 128])
		return
	}
	if(slot >= player.inv.length) return
	const t = player.inv[slot], h = player.items[0]
	if(!t && !h) return
	if(t && !h) player.items[0] = t, player.inv[slot] = null, changed |= 3
	else if(h && !t) player.inv[slot] = h, player.items[0] = null, changed |= 3
	else if(h && t && h.constructor == t.constructor && !h.savedata){
		const add = min(h.count, t.maxStack - t.count)
		if(!(h.count -= add))player.items[0] = null, changed |= 1
		t.count += add
		changed |= 2
	}else player.inv[slot] = h, player.items[0] = t, changed |= 3
	if(!changed) return
	player.itemschanged(changed & 1 ? changed & 2 ? [128, slot] : [128] : [slot])
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
		const t = items[slot], h = player.items[0]
		if(t && !h){
			player.items[0] = t.constructor(t.count - (t.count >>= 1))
			if(!t.count)items[slot] = null
		}else if(h && !t){
			items[slot] = h.constructor(1)
			if(!--h.count)player.items[0] = null
		}else if(h && t && h.constructor == t.constructor && !h.savedata && t.count < t.maxStack){
			t.count++
			if(!--h.count)player.items[0] = null
		}else items[slot] = h, player.items[0] = t
		player.itemschanged([128])
		player.interface.itemschanged([slot | 128])
		return
	}
	if(slot >= player.inv.length) return
	const t = player.inv[slot], h = player.items[0]
	if(t && !h){
		player.items[0] = t.constructor(t.count - (t.count >>= 1))
		if(!t.count)player.inv[slot] = null
	}else if(h && !t){
		player.inv[slot] = h.constructor(1)
		if(!--h.count)player.items[0] = null
	}else if(h && t && h.constructor == t.constructor && !h.savedata && t.count < t.maxStack){
		t.count++
		if(!--h.count)player.items[0] = null
	}else player.inv[slot] = h, player.items[0] = t
	player.itemschanged([128, slot])
}

function dropItemPacket(player, buf){
	if(!player.inv[player.selected]) return
	const e = Entities.item(player.x, player.y + player.head - 0.5)
	e.item = player.inv[player.selected]
	e.dx = player.dx + player.f > 0 ? 7 : -7
	e.place(player.world)
	player.inv[player.selected] = null
	player.itemschanged([player.selected])
}

function closeInterfacePacket(player, _){
	player.interface = null
	if(player.items[0]){
		const e = Entities.item(player.x, player.y + player.head - 0.5)
		e.item = player.items[0]
		e.dx = player.dx + player.f > 0 ? 7 : -7
		e.place(player.world)
		player.items[0] = null
		player.itemschanged([128])
	}
}

export const codes = Object.assign(new Array(256), {
	4: playerMovePacket,
	12: openContainerPacket,
	13: openEntityPacket,
	15: closeInterfacePacket,
	32: inventoryPacket,
	33: altInventoryPacket,
	34: dropItemPacket
})
export function onstring(player, text){
	if(!(text = text.trimEnd())) return
	if(text[0] == '/'){
		try{
			const match = text.slice(1).match(/"(?:[^\\"]|\\.)*"|[^"\s]\S*|"/g)
			if(!match) return void player.chat('Slash, yes, very enlightening.')
			for(let i = 0; i < match.length; i++){
				const a = match[i]
				try{match[i] = a[0]=='"'?JSON.parse(a):a}catch(e){throw 'Failed parsing argument '+i}
			}
			if(!(match[0] in commands))throw 'No such command: /'+match[0]
			if(this.permissions < MOD){
				if(!anyone_help[match[0]])throw "You do not have permission to use /"+match[0]
			}else if(player.permission == MOD && !mod_help[match[0]])throw "You do not have permission to use /"+match[0]
			stat('misc', 'commands_used')
			let res = commands[match[0]].apply(player, match.slice(1))
			res && player.chat(res)
		}catch(e){
			player.chat(err(e), 9)
		}
	}else{
		stat('misc', 'chat_messages')
		if(text.includes(CONFIG.magic_word)) stat('misc', 'magic_word')
		if(text.includes('pineapple') && text.includes('pizza')) stat('misc', 'controversial')
		chat(prefix(player)+text, undefined, player)
	}
}

export const PROTOCOL_VERSION = 1
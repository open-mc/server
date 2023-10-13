import { chat, prefix } from './chat.js'
import { anyone_help, commands, err, executeCommand, log, mod_help } from './commands.js'
import { Entities } from '../entities/entity.js'
import { DataWriter } from '../modules/dataproto.js'
import { gridevent, cancelgridevent, down, getX, getY, goto, jump, left, peek, peekdown, peekleft, peekright, peekup, right, up, peekat } from './ant.js'
import { currentTPS, entityMap } from '../world/tick.js'
import { fastCollision, stepEntity } from '../world/physics.js'
import { Dimensions, GAMERULES, stat, statRecord } from '../world/index.js'

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
	player.state = player.state & 0xFFFF8000 | buf.short()&0x7fff; let rubber = false
	// where the player was
	const {x: ox, y: oy, dx, dy} = player

	let mx = ifloat(x - ox), my = ifloat(y - oy)
	if(CONFIG.socket.movementchecks){
		const {movementcheckmercy: mercy} = CONFIG.socket
		if(mx >= 0){
			const excess = mx - max(9, dx) / currentTPS
			sock.rx -= excess
			if(sock.rx < 0){
				mx += sock.rx
				sock.rx = 0
				rubber = true
			}else if(sock.rx > mercy) sock.rx = mercy
		}else{
			const excess = mx - min(-9, dx) / currentTPS
			sock.rx += excess
			if(sock.rx < 0){
				mx -= sock.rx
				sock.rx = 0
				rubber = true
			}else if(sock.rx > mercy) sock.rx = mercy
		}
		if(my >= 0){
			const excess = my - max(9, dy) / currentTPS
			sock.ry -= excess
			if(sock.ry < 0){
				my += sock.ry
				sock.ry = 0
				rubber = true
			}else if(sock.ry > mercy) sock.ry = mercy
		}else{
			const tV = player.world.gy * player.gy / (1 - player.yDrag)
			const excess = my - min(tV * 1.2, dy) / currentTPS
			sock.ry += excess
			if(sock.ry < 0){
				my -= sock.ry
				sock.ry = 0
				rubber = true
			}else if(sock.ry > mercy) sock.ry = mercy
		}
	}
	if(!rubber){
		player.dx = mx * currentTPS
		player.dy = my * currentTPS
		fastCollision(player)
		player.impactDx = buf.float(); player.impactDy = buf.float()
		if(player.world) stepEntity(player)
	}else player.rubber(), buf.double()
}

const DEFAULT_BLOCKSHAPE = [0, 0, 1, 1]
function playerMovePacket(player, buf){
	if(!player.world) return
	top: {
		let t = Date.now() / 1000
		if(t < (t = max(this.movePacketCd + 1 / currentTPS, t - 2))) return
		this.movePacketCd = t
		if(buf.byte() != this.r || !player.chunk) return

		if(player.state&0x8000) break top

		validateMove(this, player, buf)
		if(!player.world) return
		
		statRecord('player', 'max_speed', Math.sqrt(player.dx * player.dx + player.dy * player.dy))
		statRecord('player', 'max_dist', Math.sqrt(player.x * player.x + player.y * player.y))
		const sel = buf.byte()
		if(player.selected != (player.selected = (sel & 127) % 9)){
			const res = new DataWriter()
			res.byte(15)
			res.uint32(player.netId); res.short(player.netId / 4294967296 | 0)
			res.byte(player.selected)
			player.emit(res)
		}
		const x = buf.float(), y = buf.float()
		if(x != x){
			player.f = y || 0
			const e = entityMap.get(buf.uint32() + buf.short() * 4294967296)
			if(e && e != player && (e.x - player.x) * (e.x - player.x) + (e.y - player.y) * (e.y - player.y) <= (REACH + 2) * REACH && e.chunk.sockets.includes(this)){
				//hit e
				const itm = player.inv[player.selected]
				e.damage?.(itm?.damage?.(e) ?? 1, player)
			}
			break top
		}
		let bx = floor(player.x) | 0, by = floor(player.y + player.head) | 0
		goto(player.world, bx, by)
		const reach = min(sqrt(x * x + y * y), 10)
		let d = 0, px = ifloat(player.x - bx), py = ifloat(player.y + player.head - by)
		const dx = x / reach, dy = y / reach
		let l = 0
		const item = player.inv[sel&127], {interactFluid} = item
		a: while(d < reach){
			const {solid, replacable, mustBreak, blockShape = DEFAULT_BLOCKSHAPE, fluidLevel} = peek()
			if((solid && !replacable) || (sel > 127 && mustBreak) || (interactFluid && fluidLevel)){
				for(let i = 0; i < blockShape.length; i += 4){
					const x0 = blockShape[i], x1 = blockShape[i+2], y0 = blockShape[i+1], y1 = blockShape[i+3]
					if(dx > 0 && px <= x0){
						const iy = py + (dy / dx) * (x0-px)
						if(iy >= y0 && iy <= y1) break a
					}else if(dx < 0 && px >= x1){
						const iy = py + (dy / dx) * (x1-px)
						if(iy >= y0 && iy <= y1) break a
					}
					if(dy > 0 && py <= y0){
						const ix = px + (dx / dy) * (y0-py)
						if(ix >= x0 && ix <= x1) break a
					}else if(dy < 0 && py >= y1){
						const ix = px + (dx / dy) * (y1-py)
						if(ix >= x0 && ix <= x1) break a
					}
				}
			}
			if(dx > 0){
				const iy = py + dy * (1 - px) / dx
				if(iy >= 0 && iy <= 1){right(); l=l<<16|255; d += (1 - px) / dx; px = 0; py = iy; continue}
			}else if(dx < 0){
				const iy = py + dy * -px / dx
				if(iy >= 0 && iy <= 1){left(); l=l<<16|1; d += -px / dx; px = 1; py = iy; continue}
			}
			if(dy > 0){
				const ix = px + dx * (1 - py) / dy
				if(ix >= 0 && ix <= 1){up(); l=l<<16|65280; d += (1 - py) / dy; py = 0; px = ix; continue}
			}else if(dy < 0){
				const ix = px + dx * -py / dy
				if(ix >= 0 && ix <= 1){down(); l=l<<16|256; d += -py / dy; py = 1; px = ix; continue}
			}
			//failsafe
			break top
		}
		if(d >= reach){
			const {solid, replacable, blockShape} = peekat(l << 24 >> 24, l << 16 >> 24)
			if(solid && !replacable && blockShape && blockShape.length == 0){
				jump(l << 24 >> 24, l << 16 >> 24)
				px -= l << 24 >> 24; py -= l << 16 >> 24
				l >>>= 16
				if(l == 1) px = 1
				else if(l == 255) px = 0
				else if(l == 256) py = 1
				else if(l == 65280) py = 0
			}else{
				if(sel > 127) break top
				px = (player.x + x) % 1; py = (player.y + player.head + y) % 1
			}
		}
		px -= l << 24 >> 24; py -= l << 16 >> 24
		if(sel > 127){
			const block = peek()
			if(block.solid | block.mustBreak){
				if(!player.breakGridEvent | player.bx != (player.bx = getX()) | player.by != (player.by = getY())){
					if(player.breakGridEvent)
						cancelgridevent(player.breakGridEvent)
					player.blockBreakLeft = round((item ? item.breaktime(block) : block.breaktime) * currentTPS)
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
		if(b.solid | (item.interactFluid&&b.fluidLevel)){
			if(item && item.interact){
				const c = item.count
				const i2 = item.interact(b) ?? item
				if(i2 !== item || c !== i2.count){
					if(i2.count === 0) player.inv[sel] = null
					else player.inv[sel] = i2
					player.itemschanged([sel])
				}
				return
			}
			if(!l) break top
		}
		if(!item) break top
		jump(l << 24 >> 24, l << 16 >> 24)
		if(!peekup().solid && !peekleft().solid && !peekdown().solid && !peekright().solid) break top
		b = peek()
		if(!b.replacable) break top
		if(false){ // TODO better entity check allowing for quasi-solid blocks like sugar_cane
			const x = getX(), y = getY()
			if(x < player.x + player.width && x + 1 > player.x - player.width && y < player.y + player.height && y + 1 > player.y) break top
		}
		if(item.place){
			item.place(px, py)
			const c = item.count
			const i2 = item.place() ?? item
			if(i2 !== item || c !== i2.count){
				if(i2.count === 0) player.inv[sel] = null
				else player.inv[sel] = i2
				player.itemschanged([sel])
			}
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

function respawnPacket(player, _){
	player.x = GAMERULES.spawnx
	player.y = GAMERULES.spawny
	player.world = Dimensions[GAMERULES.spawnworld]
	player.damage(-Infinity, null)
	player.state &= ~0x8000
	player.age = 0
	player.dx = player.dy = 0
	player.rubber()
}

function openContainerPacket(player, buf){
	if(this.interface) return
	const x = buf.int(), y = buf.int()
}
function openEntityPacket(player, buf){
	if(this.interface) return
	const e = entityMap.get(buf.uint32() + buf.short() * 4294967296)
	const dx = e.x - player.x, dy = e.y - player.y
	if(dx * dx + dy * dy > (REACH + 2) * REACH || !e.chunk.sockets.includes(this)) return
	this.interface = e
	const res = new DataWriter()
	res.byte(13)
	res.uint32(e.netId); res.short(e.netId / 4294967296 | 0)
	res.byte(0)
	this.send(res.build())
}
function inventoryPacket(player, buf){
	// Clicked on a slot in their inventory
	if(!this.interface) return
	let slot = buf.byte()
	let changed = 0
	if(slot > 127){
		slot &= 127
		if(!this.interface.items || slot == 128) return
		const {items} = this.interface
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
	if(!this.interface) return
	let slot = buf.byte()
	if(slot > 127){
		slot &= 127
		if(!this.interface.items) return
		const {items} = this.interface
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
		this.interface.itemschanged([slot | 128])
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
	const e = new Entities.item()
	e.item = player.inv[player.selected]
	e.dx = player.dx + player.f > 0 ? 7 : -7
	e.place(player.world, player.x, player.y + player.head - 0.5)
	player.inv[player.selected] = null
	player.itemschanged([player.selected])
}

function closeInterfacePacket(player, _){
	this.interface = null
	if(player.items[0]){
		const e = new Entities.item()
		e.item = player.items[0]
		e.dx = player.dx + player.f > 0 ? 7 : -7
		e.place(player.world, player.x, player.y + player.head - 0.5)
		player.items[0] = null
		player.itemschanged([128])
	}
}

export const codes = Object.assign(new Array(256), {
	4: playerMovePacket,
	5: respawnPacket,
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
			const match = text.slice(1).match(/"(?:[^\\"]|\\.)*"|[^"\s]\S*|"/g) || ['help']
			for(let i = 0; i < match.length; i++){
				const a = match[i]
				try{match[i] = a[0]=='"'?JSON.parse(a):a}catch(e){throw 'Failed parsing argument '+i}
			}
			const res = executeCommand(match[0], match.slice(1), player, this.permissions)
			if(res)
				if(res.then) res.then(a => a && player.chat(a), e => player.chat(err(e), 9))
				else player.chat(res)
		}catch(e){player.chat(err(e), 9)}
	}else{
		stat('misc', 'chat_messages')
		if(text.includes(CONFIG.magic_word)) stat('misc', 'magic_word')
		if(text.includes('pineapple') && text.includes('pizza')) stat('misc', 'controversial')
		chat(prefix(player)+text, undefined, player)
	}
}

export const PROTOCOL_VERSION = 3
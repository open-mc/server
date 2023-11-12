import { GREEN, WHITE, chat, prefix } from './chat.js'
import { err, executeCommand } from './commands.js'
import { Entities, Entity } from '../entities/entity.js'
import { DataWriter } from '../modules/dataproto.js'
import { gridevent, cancelgridevent, down, getX, getY, goto, jump, left, peek, peekdown, peekleft, peekright, peekup, right, up, peekat, save, load } from './ant.js'
import { currentTPS, entityMap } from '../world/tick.js'
import { fastCollision, stepEntity } from '../world/physics.js'
import { Dimensions, GAMERULES, stat, statRecord } from '../world/index.js'

const REACH = 10

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
			const sel = player.selected
			player.event(13, b => b.byte(sel))
		}
		const x = buf.float(), y = buf.float()
		if(x != x){
			player.f = y || 0
			const e = entityMap.get(buf.uint32() + buf.short() * 4294967296)
			if(this.permissions >= 2 && e && e != player && (e.x - player.x) * (e.x - player.x) + (e.y - player.y) * (e.y - player.y) <= (REACH + 2) * REACH && e.chunk.sockets.includes(this)){
				//hit e
				const itm = player.inv[player.selected]
				e.damage?.(itm?.damage?.(e) ?? 1, player)
			}
			break top
		}
		if(this.permissions < 2) break top
		let bx = floor(player.x) | 0, by = floor(player.y + player.head) | 0
		goto(player.world, bx, by)
		const reach = min(sqrt(x * x + y * y), 10)
		let d = 0, px = ifloat(player.x - bx), py = ifloat(player.y + player.head - by)
		const dx = x / reach, dy = y / reach
		let l = 0
		const item = player.inv[sel&127], interactFluid = item?.interactFluid ?? false
		a: while(d < reach){
			const {solid, replacable, mustBreak, blockShape = DEFAULT_BLOCKSHAPE, flows} = peek()
			if((solid && !replacable) || (sel > 127 && mustBreak) || (interactFluid && flows === false)){
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
			const {solid, replacable, targettable, flows} = peekat(l << 24 >> 24, l << 16 >> 24)
			if(((!solid && !replacable && targettable) || (interactFluid && flows === false))){
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
			if((block.targettable??block.solid) | block.mustBreak){
				if(!player.breakGridEvent | player.bx != (player.bx = getX()) | player.by != (player.by = getY())){
					if(player.breakGridEvent)
						cancelgridevent(player.breakGridEvent)
					player.blockBreakLeft = round((item ? item.breaktime(block) : block.breaktime) * currentTPS)
					player.breakGridEvent = gridevent(4, buf => buf.float(player.blockBreakLeft))
				}
				return
			}
			if(item && item.interact2){
				item.interact2(player)
				if(!item.count) player.inv[sel&127] = null
				player.itemschanged([sel&127], 0, player.inv)
			}
			break top
		}
		let b = peek()
		if((b.targettable??b.solid) | (interactFluid && b.fluidLevel)){
			b: if(item && item.interact){
				const c = item.count
				const i2 = item.interact(b, player) ?? item
				if(i2 === true) break b
				if(i2 !== item || c !== i2.count){
					if(!i2 || i2.count === 0) player.inv[sel] = null
					else player.inv[sel] = i2
					player.itemschanged([sel], 0, player.inv)
				}
				return
			}
			b: if(!(player.state&2) && b.interact){
				const c = item?.count??0
				const i2 = b.interact(item, player) ?? item
				if(i2 === true) break b
				if(i2 !== item || c !== (i2?.count??0)){
					if(!i2 || i2.count === 0) player.inv[sel] = null
					else player.inv[sel] = i2
					player.itemschanged([sel], 0, player.inv)
				}
				return
			}
			if(!l) break top
		}
		if(!item) break top
		jump(l << 24 >> 24, l << 16 >> 24)
		{
			const up = peekup(), left = peekleft(), down = peekdown(), right = peekright()
			if(interactFluid){
				if(up.flows === false && left.flows === false && down.flows === false && right.flows === false) break top
			}else if(!(up.targettable??up.solid) && !(left.targettable??left.solid) && !(down.targettable??down.solid) && !(right.targettable??right.solid)) break top
		}
		b = peek()
		if(!b.replacable && !(interactFluid && b.flows === false)) break top
		if(false){ // TODO better entity check allowing for quasi-solid blocks like sugar_cane
			const x = getX(), y = getY()
			if(x < player.x + player.width && x + 1 > player.x - player.width && y < player.y + player.height && y + 1 > player.y) break top
		}
		if(item.place){
			const c = item.count
			const i2 = item.place(px, py, player) ?? item
			if(i2.count != c || i2 !== item)
				if(!i2 || i2.count === 0) player.inv[sel&127] = null
				else player.inv[sel&127] = i2
			stat('player', 'blocks_placed')
		}else if(!item.count) player.inv[sel&127] = null
		player.itemschanged([sel&127], 0, player.inv)
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

function openInventoryPacket(player, buf){
	player.openInterface(player, 1)
}
function inventoryPacket(player, buf){
	// Clicked on a slot in their inventory
	if(!this.interface) return
	let slot = buf.byte()
	let changed = 0
	if(slot > 127){
		slot &= 127
		if(player.checkInterface()) return
		const items = this.interface.interface?.(this.interfaceId&255)
		if(!items || slot >= items.length) return
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
		if(changed & 1)
			player.itemschanged([36], 0, player.inv)
		if(changed & 2)
			this.interface.itemschanged([slot], this.interfaceId, items, this.interfaceId&256?this:null)
		return
	}
	if(slot >= 36) return
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
	player.itemschanged(changed & 1 ? changed & 2 ? [36, slot] : [36] : [slot], 0, player.inv)
}

function altInventoryPacket(player, buf){
	// Right-clicked on a slot in their inventory
	if(!this.interface) return
	let slot = buf.byte()
	if(slot > 127){
		slot &= 127
		if(player.checkInterface()) return
		const items = this.interface.interface?.(this.interfaceId&255)
		if(!items || slot >= items.length) return
		const t = items[slot], h = player.inv[36]
		if(t && !h){
			player.inv[36] = new t.constructor(t.count - (t.count >>= 1))
			if(!t.count)items[slot] = null
		}else if(h && !t){
			items[slot] = new h.constructor(1)
			if(!--h.count)player.inv[36] = null
		}else if(h && t && h.constructor == t.constructor && !h.savedata && t.count < t.maxStack){
			t.count++
			if(!--h.count)player.inv[36] = null
		}else items[slot] = h, player.inv[36] = t
		
		player.itemschanged([36], 0, player.inv)
		this.interface.itemschanged(slot, this.interfaceId, items, this.interfaceId&256?this:null)
		return
	}
	if(slot >= 36) return
	const t = player.inv[slot], h = player.inv[36]
	if(t && !h){
		player.inv[36] = new t.constructor(t.count - (t.count >>= 1))
		if(!t.count)player.inv[slot] = null
	}else if(h && !t){
		player.inv[slot] = new h.constructor(1)
		if(!--h.count)player.inv[36] = null
	}else if(h && t && h.constructor == t.constructor && !h.savedata && t.count < t.maxStack){
		t.count++
		if(!--h.count)player.inv[36] = null
	}else player.inv[slot] = h, player.inv[36] = t
	player.itemschanged([36, slot], 0, player.inv)
}

function dropItemPacket(player, buf){
	if(!player.inv[player.selected]) return
	const e = new Entities.item()
	e.item = player.inv[player.selected]
	e.dx = player.dx + player.f > 0 ? 7 : -7
	e.place(player.world, player.x, player.y + player.head - 0.5)
	player.inv[player.selected] = null
	player.itemschanged([player.selected], 0, player.inv)
}

function closeInterfacePacket(player, _){
	player.closeInterface()
	if(player.inv[36]){
		const e = new Entities.item()
		e.item = player.inv[36]
		e.dx = player.dx + player.f > 0 ? 7 : -7
		e.place(player.world, player.x, player.y + player.head - 0.5)
		player.inv[36] = null
		player.itemschanged([36], 0, player.inv)
	}
}

export const codes = Object.assign(new Array(256), {
	4: playerMovePacket,
	5: respawnPacket,
	13: openInventoryPacket,
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
	}else if(CONFIG.permissions.chat){
		stat('misc', 'chat_messages')
		if(text.includes(CONFIG.magic_word)) stat('misc', 'magic_word')
		if(text.includes('pineapple') && text.includes('pizza')) stat('misc', 'controversial')
		chat(prefix(player)+text, text[0]=='>'&&CONFIG.permissions.greentext?GREEN:WHITE, player)
	}
}

export const PROTOCOL_VERSION = 5
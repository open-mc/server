import { chat } from './chat.js'
import { err, executeCommand } from './_commands.js'
import { Entities } from '../entities/entity.js'
import { gridevent, cancelgridevent, down, getX, getY, goto, jump, left, peek, peekdown, peekleft, peekright, peekup, right, up, peekat, antChunk } from './ant.js'
import { currentTPS, entityMap } from '../world/tick.js'
import { fastCollision, stepEntity } from '../world/physics.js'
import { Dimensions, GAMERULES, MOD, players, stat, statRecord } from '../world/index.js'
import './commands.js'
import { ItemIDs } from '../items/item.js'

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
	const idx = buf.float(), idy = buf.float()
	if(!rubber){
		if(player.linked){
			player.dx = mx * currentTPS
			player.dy = my * currentTPS
			fastCollision(player)
			player.impactDx = idx; player.impactDy = idy
			stepEntity(player)
		}else{
			player.x += mx; player.y += my
			player.dx = player.dy = 0
			player.updateControls?.()
		}
	}else player.rubber()
}

const DEFAULT_BLOCKSHAPE = [0, 0, 1, 1]
function playerMovePacket(player, buf){
	if(!player.world || player.health <= 0 || buf.byte() != this.r) return
	let t = Date.now() / 1000
	if(t < (t = max(this.movePacketCd + 1 / currentTPS, t - 2))) return
	this.movePacketCd = t
	let prx = 2147483648, pry = 0, plx = 2147483648, ply = 0
	top: {
		validateMove(this, player, buf)
		// Player may have changed world with validateMove()->fastCollision()->.touched() or stepEntity()->.tick() etc...
		if(!player.world) break top
		
		statRecord('player', 'max_speed', sqrt(player.dx * player.dx + player.dy * player.dy))
		statRecord('player', 'max_dist', sqrt(player.x * player.x + player.y * player.y))
		const sel = buf.byte()
		if(player.selected != (player.selected = (sel & 127) % 9)){
			const sel = player.selected
			player.event(13, b => b.byte(sel))
		}
		const x = buf.float(), y = buf.float()
		if(x != x){
			player.f = y || 0
			const e = entityMap.get(buf.uint32() + buf.short() * 4294967296)
			if(this.perms >= 2 && e && e.chunk && e != player && (e.x - player.x) * (e.x - player.x) + (e.y - player.y) * (e.y - player.y) <= (REACH + 2) * REACH && e.chunk.sockets.includes(this)){
				//hit e
				const itm = player.inv[player.selected]
				e.damage?.(itm?.damage?.(e) ?? 1, player)
			}
			break top
		}
		if(sel<128) prx = buf.int(), pry = buf.int()
		if(this.perms < 2) break top
		let bx = floor(player.x) | 0, by = floor(player.y + player.head) | 0
		goto(player.world, bx, by)
		const reach = min(hypot(x, y), 10)
		let d = 0, px = ifloat(player.x - bx), py = ifloat(player.y + player.head - by)
		const dx = x / reach, dy = y / reach
		let l = 0
		const item = player.inv[sel&127], interactFluid = item?.interactFluid ?? false
		a: while(d < reach){
			const {solid, mustBreak, blockShape = DEFAULT_BLOCKSHAPE, flows} = peek()
			if(solid || (sel > 127 && mustBreak) || (interactFluid && flows === false)){
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
		let ax = l << 24 >> 24, ay = l << 16 >> 24
		if(d >= reach){
			const {solid, targettable, flows} = peekat(l << 24 >> 24, l << 16 >> 24)
			if(((targettable && !solid) || (interactFluid && flows === false))){
				jump(ax, ay)
				px -= ax; py -= ay
				l >>>= 16
				ax = l << 24 >> 24, ay = l << 16 >> 24
				if(l == 1) px = 1
				else if(l == 255) px = 0
				else if(l == 256) py = 1
				else if(l == 65280) py = 0
			}else{
				if(sel > 127) break top
				px = ((player.x + x)%1+1)%1; py = ((player.y + player.head + y)%1+1)%1
			}
		}else px -= ax, py -= ay
		
		if(sel > 127){
			const block = peek()
			if((block.targettable||block.solid) | block.mustBreak){
				if(!player.breakGridEvent | player.bx != (player.bx = getX()) | player.by != (player.by = getY())){
					if(player.breakGridEvent)
						cancelgridevent(player.breakGridEvent)
					player.blockBreakLeft = this.mode == 1 ? 0 : round((item ? item.breaktime(block) : block.breaktime) * currentTPS)
					player.breakGridEvent = gridevent(4, buf => buf.float(player.blockBreakLeft))
					player.state |= 8
				}
				return
			}
			if(item && item.interact2){
				const i2 = item.interact2(player)
				if(typeof i2 == 'object') player.setItem(0, sel&127, i2), player.itemChanged(0, sel&127, i2)
				else if(i2 && this.mode!=1){
					if((item.count -= +i2) <= 0) player.setItem(0, sel&127, null)
					player.itemChanged(0, sel&127, item.count <= 0 ? null : item)
				}
			}
			break top
		}
		let b = peek()
		plx = getX(); ply = getY()
		if((b.targettable||b.solid) | (interactFluid && b.fluidLevel)){
			b: if(item && item.interact){
				const i2 = item.interact(b, player)
				if(i2 === undefined) break b
				if(typeof i2 == 'object') player.setItem(0, sel&127, i2), player.itemChanged(0, sel&127, i2)
				else if(i2 && this.mode!=1){
					if((item.count -= +i2) <= 0) player.setItem(0, sel&127, null)
					player.itemChanged(0, sel&127, item.count <= 0 ? null : item)
				}
				break top
			}
			b: if(!(player.state&2) && b.interact){
				const i2 = b.interact(item, player)
				if(i2 === undefined) break b
				if(typeof i2 == 'object') player.setItem(0, sel&127, i2), player.itemChanged(0, sel&127, i2)
				else if(i2 && this.mode!=1){
					if((item.count -= +i2) <= 0) player.setItem(0, sel&127, null)
					player.itemChanged(0, sel&127, item.count <= 0 ? null : item)
				}
				break top
			}
			if(!l) break top
		}
		if(!item) break top
		jump(ax, ay); plx = plx+ax|0; ply = ply+ay|0
		{
			const up = peekup(), left = peekleft(), down = peekdown(), right = peekright()
			if(interactFluid){
				if(up.flows === false && left.flows === false && down.flows === false && right.flows === false) break top
			}else if(!(up.targettable||up.solid) && !(left.targettable||left.solid) && !(down.targettable||down.solid) && !(right.targettable||right.solid)) break top
		}
		b = peek()
		if(interactFluid && b.flows === false) break top
		if(false){
			// TODO better entity check allowing for quasi-solid blocks like sugar_cane
			if(plx < player.x + player.width && plx + 1 > player.x - player.width && ply < player.y + player.height && ply + 1 > player.y) break top
		}
		if(item.place && !(item.forbidden&&this.perms<MOD)){
			player.state |= 8
			const i2 = item.place(px, py, player)
			if(typeof i2 == 'object') player.setItem(0, sel&127, i2), player.itemChanged(0, sel&127, i2)
			else if(i2 && this.mode!=1){
				if((item.count -= +i2) <= 0) player.setItem(0, sel&127, null)
				player.itemChanged(0, sel&127, item.count <= 0 ? null : item)
			}
			stat('player', 'blocks_placed')
		}
	}
	if(plx < 2147483648) player.state |= 8
	else player.state &= -9
	if(prx < 2147483648 && prx != plx || pry != ply){
		goto(player.world, prx, pry)
		if(antChunk.sockets.includes(player.sock)){
			const bl = peek(), {tbuf} = player.sock
			tbuf.byte(0); tbuf.int(getX()); tbuf.int(getY())
			tbuf.short(bl.id)
			if(bl.savedata) tbuf.write(bl.savedata, bl)
		}
	}
	if(player.breakGridEvent){
		cancelgridevent(player.breakGridEvent)
		player.breakGridEvent = 0
		player.blockBreakLeft = -1
		player.state &= -9
		stat('player', 'break_abandon')
	}
}

function respawnPacket(player, _){
	if(player.health) return
	player.world = Dimensions[GAMERULES.spawnworld]
	player.x = GAMERULES.spawnx
	player.y = GAMERULES.spawny
	player.link()
	player.damage(-Infinity, null)
	player.age = 0
	player.dx = player.dy = 0
	player.rubber()
}

function openInventoryPacket(player, buf){
	player.openInterface(player, 1)
}
function inventoryPacket(player, buf){
	// Clicked on a slot in their inventory
	if(player.checkInterface()) return
	let slot = buf.byte()
	const int = slot > 127 ? this.interface : player, id = slot > 127 ? this.interfaceId : 0
	slot &= 127
	const r = int.slotClicked(id, slot&127, player.getItem(2, 0), player)
	if(r !== undefined){
		player.setItem(2, 0, r)
		player.itemChanged(2, 0, r)
	}
}

function altInventoryPacket(player, buf){
	// Right-clicked on a slot in their inventory
	if(player.checkInterface()) return
	let slot = buf.byte()
	const int = slot > 127 ? this.interface : player, id = slot > 127 ? this.interfaceId : 0
	slot &= 127
	const r = int.slotAltClicked(id, slot&127, player.getItem(2, 0), player)
	if(r !== undefined){
		player.setItem(2, 0, r)
		player.itemChanged(2, 0, r)
	}
}

function dropItemPacket(player, buf){
	const item = player.getItem(0, player.selected)
	if(item){
		player.setItem(0, player.selected, null)
		player.itemChanged(0, player.selected, null)
		const e = new Entities.item()
		e.item = item
		e.dx = player.dx + player.f > 0 ? 7 : -7
		e.place(player.world, player.x, player.y + player.head - 0.5)
	}
}
function dropSlot(p, id, slot){
	const t = p.getItem(id, slot)
	if(t) p.setItem(id, slot, null), p.itemChanged(id, slot, null), p.giveAndDrop(t)
}
function closeInterfacePacket(player, _){
	player.closeInterface()
	dropSlot(player, 2, 0)
	dropSlot(player, 1, 5)
	dropSlot(player, 1, 6)
	dropSlot(player, 1, 7)
	dropSlot(player, 1, 8)
}

export function voiceChat(player, buf){
	if(buf.left < 2) return
	const r = CONFIG.proximitychat || 0
	if(!r || !player.linked) return
	const packet = new DataView(new ArrayBuffer(buf.left + 7))
	new Uint8Array(packet.buffer).set(new Uint8Array(buf.buffer, buf.byteOffset + buf.i, buf.left), 7)
	packet.setUint8(0, 96)
	const t = new Set
	if(typeof r == 'number'){
		packet.setUint32(1, player.netId|0); packet.setUint16(5, player.netId/4294967296|0)
		const cx0 = ifloor(player.x-r)>>>6, cx1 = ifloor(player.x+r)+64>>>6
		const cy0 = ifloor(player.y-r)>>>6, cy1 = ifloor(player.y+r)+64>>>6
		for(let x = cx0; x != cx1; x=x+1&0x3ffffff){
			for(let y = cy0; y != cy1; y=y+1&0x3ffffff){
				const ch = player.world.get(x+y*0x4000000)
				if(!ch) continue
				for(const s of ch.sockets){
					if(!s.entity || s.entity === player) continue
					const dx = s.entity.x - player.x, dy = s.entity.y - player.y
					if(dx*dx+dy*dy > r*r) continue
					t.add(s)
				}
			}
		}
	}else if(r == 'world'){
		for(const p of players.values())
			if(p.world == player.world && p != player)
				t.add(p.sock)
	}else if(r == 'server'){
		for(const p of players.values())
			if(p != player) t.add(p.sock)
	}
	for(const s of t) s.send(packet.buffer)
}

function disappearPacket(player){
	if(this.perms<3) return void player.chat('\\+9You do not have permission to link/unlink')
	if(!player.linked){
		player.link()
		if(player.health <= 0) player.damage(-Infinity, null)
	}else player.unlink()
}

export function creativeItemPacket(player, buf){
	const id = buf.short()
	if(id >= ItemIDs.length) return
	const a = new ItemIDs[id](1)
	a.count = min(a.maxStack, buf.byte()||1)
	const b = player.getItem(2, 0)
	if(b && (b.constructor !== a.constructor || a.savedata)){
		player.setItem(2, 0, null)
		player.itemChanged(2, 0, null)
		return
	}
	player.setItem(2, 0, a)
	player.itemChanged(2, 0, a)
}

export const codes = Object.assign(new Array(256), {
	4: playerMovePacket,
	5: respawnPacket,
	6: disappearPacket,
	13: openInventoryPacket,
	15: closeInterfacePacket,
	20: creativeItemPacket,
	32: inventoryPacket,
	33: altInventoryPacket,
	34: dropItemPacket,
	96: voiceChat,
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
			stat('misc', 'commands_used')
			const res = executeCommand(match[0], match.slice(1), player, this.perms)
			if(res)
				if(res.then) res.then(a => a && player.chat(a), e => player.chat(err(e)))
				else player.chat(res)
		}catch(e){player.chat(err(e))}
	}else if(CONFIG.permissions.chat){
		stat('misc', 'chat_messages')
		if(text.includes(CONFIG.magic_word)) stat('misc', 'magic_word')
		text = text.replaceAll('\\','\\\\')
		if(text[0]=='>'&&CONFIG.permissions.greentext) text = `<${player.name}> \\+a${text}`
		else text = `<${player.name}> ${text}`
		chat(text, player)
	}
}
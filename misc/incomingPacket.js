import { BlockIDs, Blocks } from '../blocks/block.js'
import { chat, prefix } from './chat.js'
import { anyone_help, commands, err, mod_help } from './commands.js'
import { MOD, TPS } from '../config.js'
import { entityMap } from '../entities/entity.js'
import { DataWriter } from '../utils/data.js'
import { blockevent, cancelblockevent, goto, peek, place } from './ant.js'

const REACH = 10

function playerMovePacket(player, buf){
	let t = Date.now()
	if(t < (t = max(this.movePacketCd + 1000 / TPS, t - 2000)))return
	this.movePacketCd = t
	if(buf.byte() != this.r || !player.chunk)return
	player.move(buf.double(), buf.double())
	player.state = buf.short()
	player.dx = buf.float(); player.dy = buf.float(); player.f = buf.float()
	if(player.selected != (player.selected = buf.byte() % 9)){
		const res = new DataWriter()
		res.byte(15)
		res.uint32(player._id); res.short(player._id / 4294967296 | 0)
		res.byte(player.selected)
		player.emit(res)
	}
}

function useItemPacket(player, buf){
	const slot = buf.byte() % 9
	const x = buf.int(), y = buf.int()
	const dx = x - player.x, dy = y - player.y
	if(dx * dx + dy * dy > (REACH + 2) * REACH) return
	const item = player.inv[slot]
	if(!item) return
	goto(x, y, player.world)
	const b = peek()
	if(b.solid) b.interact(item)
	else item.interact(player)
	if(!item.count) player.inv[slot] = null
	const res = new DataWriter()
	res.byte(32)
	res.uint32(player._id)
	res.short(player._id / 4294967296 | 0)
	res.byte(slot), res.item(player.inv[slot])
	player.emit(res)
}

function altItemPacket(player, buf){
	const slot = buf.byte()
	if(slot > 127){
		goto(player.bx, player.by, player.world)
		cancelblockevent(player.blockBreakEvent)
		player.blockBreakEvent = 0
		player.blockBreakProgress = -1
		return
	}
	const x = buf.int(), y = buf.int()
	const dx = x - player.x, dy = y - player.y
	if(dx * dx + dy * dy > (REACH + 2) * REACH) return
	player.bx = x; player.by = y
	const item = player.inv[slot&127]
	goto(x, y, player.world)
	const b = peek()
	if(b.solid){
		cancelblockevent(player.blockBreakEvent)
		player.blockBreakProgress = 0, player.blockBreakEvent = blockevent(1)
	}else if(item){
		item.interact2(player)
		if(!item.count) player.inv[slot&127] = null
		const res = new DataWriter()
		res.byte(32)
		res.uint32(player._id)
		res.short(player._id / 4294967296 | 0)
		res.byte(slot&127), res.item(player.inv[slot&127])
		player.emit(res)
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
		if(changed & 1){
			const res = new DataWriter()
			res.byte(32)
			res.uint32(player._id)
			res.short(player._id / 4294967296 | 0)
			res.byte(36), res.item(player.inv[36])
			player.emit(res)
		}
		if(changed & 2){
			const res = new DataWriter()
			res.byte(32)
			res.uint32(player._id)
			res.short(player._id / 4294967296 | 0)
			res.byte(slot | 128), res.item(items[slot])
			player.interface.emit(res)
		}		
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
	const res = new DataWriter()
	res.byte(32)
	res.uint32(player._id)
	res.short(player._id / 4294967296 | 0)
	if(changed & 1) res.byte(36), res.item(player.inv[36])
	if(changed & 2) res.byte(slot), res.item(player.inv[slot])
	player.emit(res)
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
		let res = new DataWriter()
		res.byte(32)
		res.uint32(player._id)
		res.short(player._id / 4294967296 | 0)
		res.byte(36), res.item(player.inv[36])
		player.emit(res)
		res = new DataWriter()
		res.byte(32)
		res.uint32(player.interface._id)
		res.short(player.interface._id / 4294967296 | 0)
		res.byte(slot | 128); res.item(items[slot])
		player.interface.emit(res)
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
	const res = new DataWriter()
	res.byte(32)
	res.uint32(player._id)
	res.short(player._id / 4294967296 | 0)
	res.byte(36), res.item(player.inv[36])
	res.byte(slot), res.item(player.inv[slot])
	player.emit(res)
}

export const codes = Object.assign(new Array(256), {
	4: playerMovePacket,
	8: useItemPacket,
	9: altItemPacket,
	12: openContainerPacket,
	13: openEntityPacket,
	15(player, _){player.interface = null},
	32: inventoryPacket,
	33: altInventoryPacket,
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
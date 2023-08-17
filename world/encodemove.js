import { entityMap } from './tick.js'
import { EVENTS } from '../entities/entity.js'
import { Chunk } from './chunk.js'

export function calculateMv(e){
	let mv = 0
	if(e.x != e._x) e.x = ifloat(e.x), mv |= 1
	if(e.y != e._y) e.y = ifloat(e.y), mv |= 2
	if(e.dx != e._dx | e.dy != e._dy) e._dx = e.dx, e._dy = e.dy, mv |= 4
	if(e.world != e._world){
		e.changedWorld?.()
		if(e.sock){
			let buf = new DataWriter()
			buf.byte(2)
			buf.string(e.world.id)
			buf.float(e.world.gx)
			buf.float(e.world.gy)
			buf.double(e.world.tick)
			e.sock.send(buf.build())
		}
		e.moved?.()
		mv |= 256
		e._world = e.world
	}else if(mv & 3) e.moved?.()
	e._x = e.x; e._y = e.y
	if(e.state != e._state | e.f != e._f) e._state = e.state, e._f = e.f, mv |= 8
	if(e.name != e._name) e._name = e.name, mv |= 16
	if(e.pendingEvents.length) mv |= 32
	
	const cx = floor(e.x)>>>6, cy = floor(e.y)>>>6
	if(!e.chunk || (mv & 256 | cx^e.chunk.x | cy^e.chunk.y)){
		const chunk = e.world.get(cx+cy*0x4000000)
		if(chunk){
			if(e.chunk) e.chunk.entities.remove(e)
			void (e.chunk = chunk).entities.push(e)
		} // VOID ENTITY DILEMMA
	}
	return mv & 255
}

export function encodeMove(e, sock, mv){
	const {ebuf} = sock
	ebuf.byte(mv &= 255)
	ebuf.int(e.netId | 0), ebuf.short(e.netId / 4294967296 | 0)
	if(mv & 64)ebuf.short(e.id), ebuf.double(e.age), ebuf.write(e.savedata, e)
	if(mv & 1)ebuf.double(e.x)
	if(mv & 2)ebuf.double(e.y)
	if(mv & 4)ebuf.float(e.dx), ebuf.float(e.dy)
	if(mv & 8)ebuf.float(e.f), ebuf.int(e.state)
	if(mv & 16)ebuf.string(e.name)
	if(mv & 32){
		const l = e.pendingEvents.length
		for(let i = 0; i < l; i+=2){
			const id = e.pendingEvents[i]
			ebuf.byte(id)
			e.pendingEvents[i+1]?.(ebuf)
		}
		ebuf.byte(0)
	}
}
export function mirrorEntity(e){
	if(!e.world){
		if(e.chunk && e._world) for(const {ebuf} of e.chunk.sockets){
			if(e.pendingEvents.length){
				ebuf.byte(EVENTS)
				ebuf.uint32(e.netId), ebuf.uint16(e.netId / 4294967296 | 0)
				const l = e.pendingEvents.length
					for(let i = 0; i < l; i+=2){
					const id = e.pendingEvents[i]
					ebuf.byte(id)
					e.pendingEvents[i+1]?.(ebuf)
				}
				ebuf.byte(0)
			}
			ebuf.byte(0), ebuf.uint32(e.netId), ebuf.uint16(e.netId / 4294967296 | 0)
		}
		entityMap.delete(e.netId)
		e.netId = -1
		if(e.chunk) e.chunk.entities.remove(e)
		e._world = null
		return
	}
	const {chunk: _chunk} = e
	const mv = calculateMv(e)
	const {chunk} = e
	if(!chunk){
		if(_chunk) for(const {ebuf} of _chunk.sockets)
			ebuf.byte(0), ebuf.uint32(e.netId), ebuf.uint16(e.netId / 4294967296 | 0)
		return
	}
	for(const sock of chunk.sockets){
		if(e.sock == sock){
			if(_chunk && _chunk.sockets.includes(sock)){
				const emv = e.rubberMv & -33 | mv & 32
				if(emv) encodeMove(e, sock, emv)
				e.rubberMv = 0
				continue
			}
			e.rubberMv = 0
		}else if(_chunk && _chunk.sockets.includes(sock)){
			if(mv) encodeMove(e, sock, mv)
			continue
		}
		encodeMove(e, sock, 127)
	}
	if(_chunk) for(const sock of _chunk.sockets){
		if(chunk.sockets.includes(sock))continue
		sock.ebuf.byte(0), sock.ebuf.uint32(e.netId), sock.ebuf.uint16(e.netId / 4294967296 | 0)
	}
	e.pendingEvents.length = 0
}
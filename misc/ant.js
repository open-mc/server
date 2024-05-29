import { BlockIDs } from '../blocks/block.js'
import { Entity } from '../entities/entity.js'
import '../node/internals.js'

let cx = 0, cy = 0, pos = 0
let world = null, chunk = undefined
export {pos as chunkTileIndex, world as antWorld, chunk as antChunk, cx as antChunkX, cy as antChunkY}
// Our functions run on so little overhead that array or map caching becomes a big burden for close-together world access
let cachec = undefined, cachex = 0, cachey = 0

export function _newChunk(c){if(c.x===cx&&c.y===cy)chunk=c;if(c.x===cachex&&c.y===cachey)cachec=c}
export function _invalidateCache(cx, cy){if(cachex==cx&&cachey==cy)cachec=undefined}

export const getX = () => cx<<6|(pos&0b000000111111)
export const getY = () => cy<<6|pos>>6

export const save = data => ({cx,cy,pos,chunk,world,data})
export const load = o => ({cx,cy,pos,chunk,world} = o, o.data)

export function gotozero(w){
	cx = cy = pos = 0
	cachec = undefined; cachex = cachey = 0x4000000
	chunk = (world = w).get(0)
}

export function goto(w, x=0, y=0){
	if(w instanceof Entity){
		x = floor(w.x+x)|0
		y = floor(w.y+y)|0
		w = w.world
	}
	cx = x >>> 6; cy = y >>> 6; world = w; pos = (x & 63) | (y & 63) << 6
	cachex = cachey = 0x4000000
	chunk = world.get(cx+cy*0x4000000)
}
export const peekpos = (c,p) => {const b=(world=c.world,cx=c.x,cy=c.y,chunk=c)[pos=p];return b===65535?chunk.tileData.get(p):BlockIDs[b]}
export const gotopos = (c,p) => {world=c.world,cx=c.x,cy=c.y,chunk=c;pos=p}

export const visibleTo = ({sock}) => chunk ? chunk.sockets.includes(sock) : false

export function update(a = 0){
	if(!chunk) return
	const id = chunk[pos]; const b = id === 65535 ? chunk.tileData.get(pos) : BlockIDs[id]
	if(b.update && !chunk.blockupdates.has(pos)) chunk.blockupdates.set(pos, a)
}

export function place(bl, safe = false){
	const _chunk = chunk, _world = world, _cx = cx, _cy = cy, _pos = pos
	bl = bl === bl.constructor && bl.savedata ? new bl : bl
	if(!_chunk) return bl
	const _b = _chunk[_pos] === 65535 ? _chunk.tileData.get(_pos) : BlockIDs[_chunk[_pos]]
	if(safe && !_b.replaceable) return
	if(_b.unset){
		_b.unset()
		world = _world; chunk = _chunk; cx = _cx; cy = _cy; pos = _pos
	}
	if(bl.savedata){
		_chunk[_pos] = 65535
		_chunk.tileData.set(_pos, bl)
	}else{
		if(_chunk[_pos] == 65535) _chunk.tileData.delete(_pos)
		_chunk[_pos] = bl.id
	}
	if(bl.set){
		bl.set()
		world = _world; chunk = _chunk; cx = _cx; cy = _cy; pos = _pos
	}
	for(const {tbuf} of _chunk.sockets){
		tbuf.byte(0)
		tbuf.int(_cx << 6 | (_pos&63))
		tbuf.int(_cy << 6 | (_pos>>6))
		tbuf.short(bl.id)
		if(bl.savedata) tbuf.write(bl.savedata, bl)
	}
	if((pos & 63) === 0b111111){
		const c = chunk.right
		if(c){
			const p = pos&0b111111000000
			const id = c[p]; let b = id === 65535 ? c.tileData.get(p) : BlockIDs[id]
			if(b.variant){pos=p,chunk=c,cx=c.x;b=b.variant()??b;pos=_pos;cx=_cx;cy=_cy;world=_world;chunk=_chunk;if(b.savedata)c[p]=65535,c.tileData.set(p,b=b===b.constructor?new b:b);else{if(c[p]==65535)c.tileData.delete(p);c[p]=b.id}}
			if(b.update && !c.blockupdates.has(p)) c.blockupdates.set(p, 0)
		}
	}else{
		const p = pos+1
		const id = chunk[p]; let b = id === 65535 ? chunk.tileData.get(p) : BlockIDs[id]
		if(b.variant){pos=p;b=b.variant()??b;pos=_pos;cx=_cx;cy=_cy;world=_world;chunk=_chunk;if(b.savedata)chunk[p]=65535,chunk.tileData.set(p,b=b===b.constructor?new b:b);else{if(chunk[p]==65535)chunk.tileData.delete(p);chunk[p]=b.id}}
		if(b.update && !chunk.blockupdates.has(pos+1)) chunk.blockupdates.set(pos+1, 0)
	}
	if((pos & 63) === 0){
		const c = chunk.left
		if(c){
			const p = pos|0b000000111111
			const id = c[p]; let b = id === 65535 ? c.tileData.get(p) : BlockIDs[id]
			if(b.variant){pos=p,chunk=c,cx=c.x;b=b.variant()??b;pos=_pos;cx=_cx;cy=_cy;world=_world;chunk=_chunk;if(b.savedata)c[p]=65535,c.tileData.set(p,b=b===b.constructor?new b:b);else{if(c[p]==65535)c.tileData.delete(p);c[p]=b.id}}
			if(b.update && !c.blockupdates.has(p)) c.blockupdates.set(p, 0)
		}
	}else{
		const p = pos-1
		const id = chunk[p]; let b = id === 65535 ? chunk.tileData.get(p) : BlockIDs[id]
		if(b.variant){pos=p;b=b.variant()??b;pos=_pos;cx=_cx;cy=_cy;world=_world;chunk=_chunk;if(b.savedata)chunk[p]=65535,chunk.tileData.set(p,b=b===b.constructor?new b:b);else{if(chunk[p]==65535)chunk.tileData.delete(p);chunk[p]=b.id}}
		if(b.update && !chunk.blockupdates.has(pos-1)) chunk.blockupdates.set(pos-1, 0)
	}
	if((pos >> 6) === 0b111111){
		const c = chunk.up
		if(c){
			const p = pos&0b000000111111
			const id = c[p]; let b = id === 65535 ? c.tileData.get(p) : BlockIDs[id]
			if(b.variant){pos=p,chunk=c,cy=c.y;b=b.variant()??b;pos=_pos;cx=_cx;cy=_cy;world=_world;chunk=_chunk;if(b.savedata)c[p]=65535,c.tileData.set(p,b=b===b.constructor?new b:b);else{if(c[p]==65535)c.tileData.delete(p);c[p]=b.id}}
			if(b.update && !c.blockupdates.has(p)) c.blockupdates.set(p, 0)
		}
	}else{
		const p = pos+64
		const id = chunk[p]; let b = id === 65535 ? chunk.tileData.get(p) : BlockIDs[id]
		if(b.variant){pos=p;b=b.variant()??b;pos=_pos;cx=_cx;cy=_cy;world=_world;chunk=_chunk;if(b.savedata)chunk[p]=65535,chunk.tileData.set(p,b=b===b.constructor?new b:b);else{if(chunk[p]==65535)chunk.tileData.delete(p);chunk[p]=b.id}}
		if(b.update && !chunk.blockupdates.has(pos+64)) chunk.blockupdates.set(pos+64, 0)
	}
	if((pos >> 6) === 0){
		const c = chunk.down
		if(c){
			const p = pos|0b111111000000
			const id = c[p]; let b = id === 65535 ? c.tileData.get(p) : BlockIDs[id]
			if(b.variant){pos=p,chunk=c,cy=c.y;b=b.variant()??b;pos=_pos;cx=_cx;cy=_cy;world=_world;chunk=_chunk;if(b.savedata)c[p]=65535,c.tileData.set(p,b=b===b.constructor?new b:b);else{if(c[p]==65535)c.tileData.delete(p);c[p]=b.id}}
			if(b.update && !c.blockupdates.has(p)) c.blockupdates.set(p, 0)
		}
	}else{
		const p = pos-64
		const id = chunk[p]; let b = id === 65535 ? chunk.tileData.get(p) : BlockIDs[id]
		if(b.variant){pos=p;b=b.variant()??b;pos=_pos;cx=_cx;cy=_cy;world=_world;chunk=_chunk;if(b.savedata)chunk[p]=65535,chunk.tileData.set(p,b=b===b.constructor?new b:b);else{if(chunk[p]==65535)chunk.tileData.delete(p);chunk[p]=b.id}}
		if(b.update && !chunk.blockupdates.has(pos-64)) chunk.blockupdates.set(pos-64, 0)
	}
	if(bl.variant){bl=bl.variant()??bl;pos=_pos;cx=_cx;cy=_cy;world=_world;chunk=_chunk;if(bl.savedata)chunk[pos]=65535,chunk.tileData.set(pos,bl=bl===bl.constructor?new bl:bl);else{if(chunk[pos]==65535)chunk.tileData.delete(pos);chunk[pos]=bl.id}}
	if(bl.update && !chunk.blockupdates.has(pos)) chunk.blockupdates.set(pos, 0)
	return bl
}
export function placeblock(b, e = 1){
	place(b)
	gridevent(e)
}

let gridEventId = 0
export function blockevent(ev, fn){
	if(!chunk || !ev) return
	for(const {tbuf} of chunk.sockets){
		tbuf.byte(ev)
		if(ev === 255) tbuf.byte(0)
		tbuf.int(cx << 6 | (pos&0b000000111111))
		tbuf.int(cy << 6 | (pos>>6))
		if(fn) fn(tbuf)
	}
}
export function gridevent(ev, fn){
	if(!chunk || !ev) return
	const id = (gridEventId = gridEventId + 1 | 0) || (gridEventId = 1)
	for(const {tbuf} of chunk.sockets){
		tbuf.short(0xFF00|ev)
		tbuf.int(cx << 6 | (pos&0b000000111111))
		tbuf.int(cy << 6 | (pos>>6))
		tbuf.int(id)
		if(fn) fn(tbuf)
	}
	return id
}
export function cancelgridevent(id){
	if(!chunk || !id) return
	for(const {tbuf} of chunk.sockets){
		tbuf.short(65535)
		tbuf.int(id)
	}
}

export function summon(Fn){
	const e = new Fn()
	e.place(world, ((cx << 6) | (pos & 0b000000111111)) + .5, cy << 6 | pos >> 6)
	return e
}

export const peek = () => {const b=chunk?chunk[pos]:0;return b===65535?chunk.tileData.get(pos):BlockIDs[b]}


export function left(){
	if(pos & 0b000000111111){ pos--; return }
	pos |= 0b000000111111; chunk = chunk.left; cx--
}
export function right(){
	if((pos & 0b000000111111) != 0b000000111111){ pos++; return }
	pos &= 0b111111000000; chunk = chunk.right; cx++
}
export function down(){
	if(pos & 0b111111000000){ pos -= 64; return }
	pos |= 0b111111000000; chunk = chunk.down; cy--
}
export function up(){
	if((pos & 0b111111000000) != 0b111111000000){ pos += 64; return }
	pos &= 0b000000111111; chunk = chunk.up; cy++
}

export function peekleft(){
	if(pos & 0b000000111111){const b=chunk?chunk[pos-1]:0;return b===65535?chunk.tileData.get(pos-1):BlockIDs[b]}
	const b = chunk?chunk.left[pos|0b000000111111]:0
	return b==65535?chunk.left.tileData.get(pos|0b000000111111):BlockIDs[b]
}
export function peekright(){
	if((pos & 0b000000111111) != 0b000000111111){const b=chunk?chunk[pos+1]:0;return b===65535?chunk.tileData.get(pos+1):BlockIDs[b]}
	const b = chunk?chunk.right[pos&0b111111000000]:0
	return b==65535?chunk.right.tileData.get(pos&0b111111000000):BlockIDs[b]
}
export function peekdown(){
	if(pos & 0b111111000000){const b=chunk?chunk[pos-64]:0;return b===65535?chunk.tileData.get(pos-64):BlockIDs[b]}
	const b = chunk?chunk.down[pos|0b111111000000]:0
	return b==65535?chunk.down.tileData.get(pos|0b111111000000):BlockIDs[b]
}
export function peekup(){
	if((pos & 0b111111000000) != 0b111111000000){const b=chunk?chunk[pos+64]:0;return b===65535?chunk.tileData.get(pos+64):BlockIDs[b]}
	const b = chunk?chunk.up[pos&0b000000111111]:0
	return b==65535?chunk.up.tileData.get(pos&0b000000111111):BlockIDs[b]
}

export function jump(dx, dy){
	dx = (pos & 0b000000111111) + dx | 0; dy = (pos >> 6) + dy | 0
	if((dx | dy) >>> 6){
		const x = cx + (dx >>> 6) & 0x3FFFFFF, y = cy + (dy >>> 6) & 0x3FFFFFF
		if(x===cachex&y===cachey){cachex=cx;cachey=cy;cx=x;cy=y;const c=cachec;cachec=chunk;chunk=c}else{cachex=cx;cachey=cy;cachec=chunk;chunk=world.get((cx=x)+(cy=y)*0x4000000)}
		pos = (dx & 0b000000111111) | (dy & 0b000000111111) << 6
	}else pos = dx | dy << 6
}

export function peekat(dx, dy){
	const nx = (pos & 0b000000111111) + dx, ny = (pos >> 6) + dy
	if(!((nx | ny) >>> 6) && chunk){const b=chunk?chunk[nx|ny<<6]:0;return b===65535?chunk.tileData.get(nx|ny<<6):BlockIDs[b]}
	const c = world.get((cx + (nx >>> 6) & 0x3FFFFFF) + (cy + (ny >>> 6) & 0x3FFFFFF) * 0x4000000)
	const i = (nx & 0b000000111111) | (ny & 0b000000111111) << 6
	const b = c?c[i]:0
	return b===65535?c.tileData.get(i):BlockIDs[b]
}

export function select(x0, y0, x1, y1, cb){
	x0 += cx<<6|(pos&0b000000111111); x1 += (cx<<6|(pos&0b000000111111)) + 1
	y0 += cy<<6|pos>>6; y1 += (cy<<6|pos>>6) + 1
	const cx0 = floor(x0) >>> 6, cx1 = ceil(x1 / 64) & 0x3FFFFFF
	const cy0 = floor(y0) >>> 6, cy1 = ceil(y1 / 64) & 0x3FFFFFF
	for(let cxa = cx0; cxa != cx1; cxa = cxa + 1 & 0x3FFFFFF){
		for(let cya = cy0; cya != cy1; cya = cya + 1 & 0x3FFFFFF){
			const ch = (cxa === cx & cya === cy) && chunk || world.get(cxa+cya*0x4000000)
			if(!ch || !ch.entities) continue
			for(const e of ch.entities){
				if(e.netId<0 || (e.x < x0 | e.x > x1) || (e.y < y0 | e.y > y1)) continue
				cb(e)
			}
		}
	}
}

Function.optimizeImmediately(place, goto, peek, jump, peekat, right, left, up, down, peekright, peekleft, peekup, peekdown, summon, gridevent, cancelgridevent, select)
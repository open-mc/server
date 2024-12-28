import { BlockIDs } from '../blocks/block.js'
import { Entities, Entity } from '../entities/entity.js'
import { Item } from '../items/item.js'

let pos = 0, chunk = null
export {pos as chunkTileIndex, chunk as antChunk}

export const getX = () => (chunk?chunk.x<<6:0)|pos&63
export const getY = () => (chunk?chunk.y<<6:0)|pos>>6

export const save = data => ({pos,chunk,data})
export const load = o => ({pos,chunk} = o, o.data)

export function goto(w, x=0, y=0){
	if(w instanceof Entity){
		x = floor(w.x+x)|0
		y = floor(w.y+y)|0
		w = w.world
	}
	pos = (x & 63) | (y & 63) << 6
	chunk = w.get((x>>>6)+(y>>>6)*0x4000000)
}
export const peekpos = (c,p) => {const b=(chunk=c)[pos=p];return b===65535?chunk.tileData.get(p):BlockIDs[b]}
export const gotopos = (c,i) => {chunk=c;pos=i}

export const visibleTo = ({sock}) => chunk ? chunk.sockets.includes(sock) : false

export function update(a = 0){
	if(!chunk) return
	const id = chunk[pos]; const b = id === 65535 ? chunk.tileData.get(pos) : BlockIDs[id]
	if(b.update && !chunk.blockupdates.has(pos)) chunk.blockupdates.set(pos, a)
}

export const skyExposed = () => chunk?(chunk.exposure[pos&63]-(pos>>6|chunk.y<<6)|0)<=0:true

export function place(bl, safe = false){
	const _chunk = chunk, _pos = pos
	bl = bl === bl.constructor && bl.savedata ? new bl : bl
	if(!_chunk) return bl
	const _id = _chunk[_pos], _b = _id === 65535 ? _chunk.tileData.get(_pos) : BlockIDs[_id]
	if(safe && !(_b.flags&4096)) return
	if(_b.unset){
		_b.unset()
		chunk = _chunk; pos = _pos
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
		chunk = _chunk; pos = _pos
	}
	const tx = _chunk.x<<6|_pos&63, ty = _chunk.y<<6|pos>>6
	const {exposure} = _chunk, x = pos&63; let y = ty+1|0
	for(const {tbuf} of _chunk.sockets){
		tbuf.byte(0)
		tbuf.int(tx)
		tbuf.int(ty)
		tbuf.short(bl.id)
		if(bl.savedata) tbuf.write(bl.savedata, bl)
	}
	if((pos & 63) === 0b111111){
		const c = _chunk.right
		if(c){
			const p = pos&4032
			const id = c[p]; let b = id === 65535 ? c.tileData.get(p) : BlockIDs[id]
			if(b.variant){pos=p,chunk=c;b=b.variant()??b;pos=_pos;chunk=_chunk;if(b.savedata) c[p]=65535,c.tileData.set(p,b=b===b.constructor?new b:b);else{if(id==65535) c.tileData.delete(p);c[p]=b.id}}
			if(b.update && !c.blockupdates.has(p)) c.blockupdates.set(p, 0)
		}
	}else{
		const p = pos+1
		const id = _chunk[p]; let b = id === 65535 ? _chunk.tileData.get(p) : BlockIDs[id]
		if(b.variant){pos=p;b=b.variant()??b;pos=_pos;chunk=_chunk;if(b.savedata) _chunk[p]=65535,_chunk.tileData.set(p,b=b===b.constructor?new b:b);else{if(id==65535) _chunk.tileData.delete(p);_chunk[p]=b.id}}
		if(b.update && !chunk.blockupdates.has(pos+1)) chunk.blockupdates.set(pos+1, 0)
	}
	if((pos & 63) === 0){
		const c = _chunk.left
		if(c){
			const p = pos|63
			const id = c[p]; let b = id === 65535 ? c.tileData.get(p) : BlockIDs[id]
			if(b.variant){pos=p,chunk=c;b=b.variant()??b;pos=_pos;chunk=_chunk;if(b.savedata) c[p]=65535,c.tileData.set(p,b=b===b.constructor?new b:b);else{if(id==65535) c.tileData.delete(p);c[p]=b.id}}
			if(b.update && !c.blockupdates.has(p)) c.blockupdates.set(p, 0)
		}
	}else{
		const p = pos-1
		const id = _chunk[p]; let b = id === 65535 ? _chunk.tileData.get(p) : BlockIDs[id]
		if(b.variant){pos=p;b=b.variant()??b;pos=_pos;chunk=_chunk;if(b.savedata) _chunk[p]=65535,_chunk.tileData.set(p,b=b===b.constructor?new b:b);else{if(id==65535) _chunk.tileData.delete(p);_chunk[p]=b.id}}
		if(b.update && !chunk.blockupdates.has(pos-1)) chunk.blockupdates.set(pos-1, 0)
	}
	if((pos >> 6) === 0b111111){
		const c = _chunk.up
		if(c){
			const p = pos&63
			const id = c[p]; let b = id === 65535 ? c.tileData.get(p) : BlockIDs[id]
			if(b.variant){pos=p,chunk=c;b=b.variant()??b;pos=_pos;chunk=_chunk;if(b.savedata) c[p]=65535,c.tileData.set(p,b=b===b.constructor?new b:b);else{if(id==65535) c.tileData.delete(p);c[p]=b.id}}
			if(b.update && !c.blockupdates.has(p)) c.blockupdates.set(p, 0)
		}
	}else{
		const p = pos+64
		const id = _chunk[p]; let b = id === 65535 ? _chunk.tileData.get(p) : BlockIDs[id]
		if(b.variant){pos=p;b=b.variant()??b;pos=_pos;chunk=_chunk;if(b.savedata) _chunk[p]=65535,_chunk.tileData.set(p,b=b===b.constructor?new b:b);else{if(id==65535) _chunk.tileData.delete(p);_chunk[p]=b.id}}
		if(b.update && !chunk.blockupdates.has(pos+64)) chunk.blockupdates.set(pos+64, 0)
	}
	if((pos >> 6) === 0){
		const c = _chunk.down
		if(c){
			const p = pos|4032
			const id = c[p]; let b = id === 65535 ? c.tileData.get(p) : BlockIDs[id]
			if(b.variant){pos=p,chunk=c;b=b.variant()??b;pos=_pos;chunk=_chunk;if(b.savedata) c[p]=65535,c.tileData.set(p,b=b===b.constructor?new b:b);else{if(id==65535) c.tileData.delete(p);c[p]=b.id}}
			if(b.update && !c.blockupdates.has(p)) c.blockupdates.set(p, 0)
		}
	}else{
		const p = pos-64
		const id = _chunk[p]; let b = id === 65535 ? _chunk.tileData.get(p) : BlockIDs[id]
		if(b.variant){pos=p;b=b.variant()??b;pos=_pos;chunk=_chunk;if(b.savedata) _chunk[p]=65535,_chunk.tileData.set(p,b=b===b.constructor?new b:b);else{if(id==65535) _chunk.tileData.delete(p);_chunk[p]=b.id}}
		if(b.update && !chunk.blockupdates.has(pos-64)) chunk.blockupdates.set(pos-64, 0)
	}
	if(bl.variant){bl=bl.variant()??bl;pos=_pos;chunk=_chunk;if(bl.savedata) _chunk[pos]=65535,_chunk.tileData.set(pos,bl=bl===bl.constructor?new bl:bl);else{if(_id==65535) _chunk.tileData.delete(pos);_chunk[pos]=bl.id}}
	if(bl.update && !chunk.blockupdates.has(pos)) chunk.blockupdates.set(pos, 0)
	if(bl.flags&128){if(!(_b.flags&128)){
		if((exposure[x]-y|0)<0) exposure[x] = y
	}}else if((_b.flags&128)&&exposure[x]==y){
		y-=2; while(chunk){
			const i=x|y<<6&4032,b=chunk[i]
			if((b==65535?chunk.tileData.get(i):BlockIDs[b]).flags&128) break
			if(!(--y&63)) chunk = chunk.down
		}
		exposure[x] = y+1|0
		chunk = _chunk
	}
	return bl
}
export const placeblock = (b, e = 1) => void(place(b), gridevent(e))

let gridEventId = 0
export function blockevent(ev, fn){
	if(!chunk || !ev) return
	const tx = chunk.x<<6|pos&63, ty = chunk.y<<6|pos>>6
	for(const {tbuf} of chunk.sockets){
		tbuf.byte(ev)
		if(ev === 255) tbuf.byte(0)
		tbuf.int(tx)
		tbuf.int(ty)
		if(fn) fn(tbuf)
	}
}
export function gridevent(ev, fn){
	if(!chunk || !ev) return
	const id = (gridEventId = gridEventId + 1 | 0) || (gridEventId = 1)
	const tx = chunk.x<<6|pos&63, ty = chunk.y<<6|pos>>6
	for(const {tbuf} of chunk.sockets){
		tbuf.short(0xFF00|ev)
		tbuf.int(tx)
		tbuf.int(ty)
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
	if(chunk) e.place(chunk.world, ((chunk.x << 6) | (pos & 63)) + .5, chunk.y << 6 | pos >> 6)
	return e
}

export function summonDrops(drop){
	if(!chunk) return
	if(drop instanceof Item){
		const itm = new Entities.item()
		itm.item = drop
		itm.dx = random() * 6 - 3
		itm.dy = 6
		itm.place(chunk.world, (chunk.x<<6|pos&63)+0.5, (chunk.y<<6|pos>>6)+0.375)
	}else if(drop instanceof Array){
		for(const d of drop){
			if(!d) continue
			const itm = new Entities.item()
			itm.item = d
			itm.dx = random() * 6 - 3
			itm.dy = 6
			itm.place(chunk.world, (chunk.x<<6|pos&63)+0.5, (chunk.y<<6|pos>>6)+0.375)
		}
	}
}

export const peek = () => {const b=chunk?chunk[pos]:0;return b===65535?chunk.tileData.get(pos):BlockIDs[b]}
export const peekflags = () => {
	if(!chunk) return false
	const b=chunk[pos]
	return (b===65535?chunk.tileData.get(pos):BlockIDs[b]).flags
}


export function left(){
	if(pos & 63){ pos--; return }
	pos |= 63; chunk = chunk?.left
}
export function right(){
	if((pos & 63) != 63){ pos++; return }
	pos &= 4032; chunk = chunk?.right
}
export function down(){
	if(pos & 4032){ pos -= 64; return }
	pos |= 4032; chunk = chunk?.down
}
export function up(){
	if((pos & 4032) != 4032){ pos += 64; return }
	pos &= 63; chunk = chunk?.up
}

export function peekleft(){
	if(pos & 63){const b=chunk?chunk[pos-1]:0;return b===65535?chunk.tileData.get(pos-1):BlockIDs[b]}
	const l = chunk?.left, b = l?l[pos|63]:0
	return b==65535?l.tileData.get(pos|63):BlockIDs[b]
}
export const hardleft = () => {
	if(!chunk) return false
	if(pos&63){const b=chunk[pos-1];return ((b===65535?chunk.tileData.get(pos-1):BlockIDs[b]).flags&32)!=0||(chunk.flags&1)==1}
	const l = chunk.left; if(!l) return false
	const b=l[pos|63];return ((b===65535?l.tileData.get(pos|63):BlockIDs[b]).flags&32)!=0||(l.flags&1)==1
}
export const solidleft = () => {
	if(!chunk) return false
	if(pos&63){const b=chunk[pos-1];return ((b===65535?chunk.tileData.get(pos-1):BlockIDs[b]).flags&2)!=0}
	const l = chunk.left; if(!l) return false
	const b=l[pos|63];return ((b===65535?l.tileData.get(pos|63):BlockIDs[b]).flags&2)!=0
}
export function peekright(){
	if((pos&63) != 63){const b=chunk?chunk[pos+1]:0;return b===65535?chunk.tileData.get(pos+1):BlockIDs[b]}
	const r = chunk?.right, b = r?r[pos&4032]:0
	return b==65535?r.tileData.get(pos&4032):BlockIDs[b]
}
export const hardright = () => {
	if(!chunk) return false
	if((pos&63) != 63){const b=chunk[pos+1];return ((b===65535?chunk.tileData.get(pos+1):BlockIDs[b]).flags&16)!=0||(chunk.flags&1)==1}
	const r = chunk.right; if(!r) return false
	const b=r[pos&4032];return ((b===65535?r.tileData.get(pos&4032):BlockIDs[b]).flags&16)!=0||(r.flags&1)==1
}
export const solidright = () => {
	if(!chunk) return false
	if((pos&63) != 63){const b=chunk[pos+1];return ((b===65535?chunk.tileData.get(pos+1):BlockIDs[b]).flags&1)!=0}
	const r = chunk.right; if(!r) return false
	const b=r[pos&4032];return ((b===65535?r.tileData.get(pos&4032):BlockIDs[b]).flags&1)!=0
}
export function peekdown(){
	if(pos & 4032){const b=chunk?chunk[pos-64]:0;return b===65535?chunk.tileData.get(pos-64):BlockIDs[b]}
	const d = chunk?.down, b = d?d[pos|4032]:0
	return b==65535?d.tileData.get(pos|4032):BlockIDs[b]
}
export const harddown = () => {
	if(!chunk) return false
	if(pos&4032){const b=chunk[pos-64];return ((b===65535?chunk.tileData.get(pos-64):BlockIDs[b]).flags&128)!=0||(chunk.flags&1)==1}
	const d = chunk.down; if(!d) return false
	const b=d[pos|4032];return ((b===65535?d.tileData.get(pos|4032):BlockIDs[b]).flags&128)!=0||(d.flags&1)==1
}
export const soliddown = () => {
	if(!chunk) return false
	if(pos&4032){const b=chunk[pos-64];return ((b===65535?chunk.tileData.get(pos-64):BlockIDs[b]).flags&8)!=0}
	const d = chunk.down; if(!d) return false
	const b=d[pos|4032];return ((b===65535?d.tileData.get(pos|4032):BlockIDs[b]).flags&8)!=0
}
export function peekup(){
	if((pos & 4032) != 4032){const b=chunk?chunk[pos+64]:0;return b===65535?chunk.tileData.get(pos+64):BlockIDs[b]}
	const u = chunk?.up, b = u?u[pos&63]:0
	return b==65535?u.tileData.get(pos&63):BlockIDs[b]
}
export const hardup = () => {
	if(!chunk) return false
	if((pos & 4032) != 4032){const b=chunk[pos+64];return ((b===65535?chunk.tileData.get(pos+64):BlockIDs[b]).flags&64)!=0||(chunk.flags&1)==1}
	const u = chunk.up; if(!u) return false
	const b=u[pos&63];return ((b===65535?u.tileData.get(pos&63):BlockIDs[b]).flags&64)!=0||(u.flags&1)==1
}
export const solidup = () => {
	if(!chunk) return false
	if((pos & 4032) != 4032){const b=chunk[pos+64];return ((b===65535?chunk.tileData.get(pos+64):BlockIDs[b]).flags&4)!=0}
	const u = chunk.up; if(!u) return false
	const b=u[pos&63];return ((b===65535?u.tileData.get(pos&63):BlockIDs[b]).flags&4)!=0
}

export function jump(dx, dy){
	if(!chunk) return
	dx = (pos & 63) + dx | 0; dy = (pos >> 6) + dy | 0
	if((dx | dy) >>> 6){
		chunk = chunk.world.get((chunk.x+(dx>>>6)&0x3FFFFFF)+(chunk.y+(dy>>>6)&0x3FFFFFF)*0x4000000)
		pos = (dx & 63) | (dy & 63) << 6
	}else pos = dx | dy << 6
}

export function select(x0, y0, x1, y1, cb){
	if(!chunk) return
	const {x:cx,y:cy,world} = chunk
	x0 += cx<<6|(pos&63); x1 += (cx<<6|(pos&63)) + 1
	y0 += cy<<6|pos>>6; y1 += (cy<<6|pos>>6) + 1
	const cx0 = floor(x0) >>> 6, cx1 = -(floor(-x1) >> 6) & 0x3FFFFFF
	const cy0 = floor(y0) >>> 6, cy1 = -(floor(-y1) >> 6) & 0x3FFFFFF
	let lim = 65, cxa = cx0
	let ch = (cx0 === cx & cy0 === cy) && chunk || world.get(cx0+cy0*0x4000000)
	while(true){
		let c = ch, cya = cy0
		while(true){
			if(c && c.entities){
				for(const e of c.entities){
					if(e.netId<0 || (e._x < x0 | e._x > x1) || (e._y < y0 | e._y > y1)) continue
					if(!--lim) return
					cb(e)
				}
			}
			if((cya=cya+1&0x3FFFFFF) == cy1) break
			c = c?.up ?? world.get(cxa+cya*0x4000000)
		}
		if((cxa=cxa+1&0x3FFFFFF) == cx1) break
		ch = ch?.right ?? world.get(cxa+cya*0x4000000)
	}
}

Function.optimizeImmediately(place, goto, peek, jump, right, left, up, down, peekright, peekleft, peekup, peekdown, summon, gridevent, cancelgridevent, select)
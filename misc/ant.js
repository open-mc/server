import { BlockIDs } from '../blocks/block.js'
import { optimize } from '../internals.js'

let cx = 0, cy = 0, pos = 0
let world = null, chunk = undefined
export {pos as chunkTileIndex, world as antWorld, chunk as antChunk}
// Our functions run on so little overhead that array or map caching becomes a big burden for close-together world access
let cachec = undefined, cachex = 0, cachey = 0

export function _newchunk(c){if(c.x==cx&&c.y==cy)chunk=c;if(c.x==cachex&&c.y==cachey)cachec=c}

export const getX = () => cx<<6|(pos&0b000000111111)
export const getY = () => cy<<6|pos>>6

export const save = () => ({cx,cy,pos,chunk,world})
export const load = o => void ({cx,cy,pos,chunk,world} = o)

export function gotozero(w){
	cx = cy = pos = 0
	cachec = undefined; cachex = cachey = 0x4000000
	chunk = (world = w).get(0)
}

export function goto(x, y, w){
	if(typeof x == 'object')w=x.world,y=floor(x.y)|0,x=floor(x.x)|0
	cx = x >>> 6; cy = y >>> 6; world = w; pos = (x & 0b000000111111) | (y & 0b000000111111) << 6
	cachex = cachey = 0x4000000
	chunk = world.get(cx+cy*0x4000000)
}

export function gotochunk(ch){
	cx = ch.x; cy = ch.y; world = ch.world
	cachex = cachey = 0x4000000
	chunk = ch
}
export const peekpos = p => {const b=chunk?chunk[pos=p]:0;return b==65535?chunk.tileData.get(p):BlockIDs[b]}

export function place(bl){
	const _chunk = chunk, _world = world, _cx = cx, _cy = cy, _pos = pos
	if(!_chunk) return bl()
	if(_chunk[_pos].unset){
		_chunk[_pos].unset()
		world = _world; chunk = _chunk; cx = _cx; cy = _cy; pos = _pos
	}
	if(bl.savedata){
		_chunk[_pos] = 65535
		_chunk.tileData.set(_pos, bl = bl())
	}else{
		_chunk[_pos] = bl.id
		_chunk.tileData.delete(_pos)
	}
	if(bl.set){
		bl.set()
		world = _world; chunk = _chunk; cx = _cx; cy = _cy; pos = _pos
	}
	for(const {tbuf} of _chunk.sockets){
		tbuf.byte(0)
		tbuf.int(_cx << 6 | (_pos&0b000000111111))
		tbuf.int(_cy << 6 | (_pos>>6))
		tbuf.short(bl.id)
		if(bl.savedata) tbuf.write(bl.savedata, bl)
	}
	const {blockupdates} = chunk
	if((pos & 0b000000111111) == 0b000000111111){
		const ncx = cx+1&0x3FFFFFF
		void (ncx==cachex&cy==cachey ? cachec : world.get(ncx+cy*0x4000000))?.blockupdates.add(pos|0b000000111111)
	}else blockupdates.add(pos+1)
	if((pos & 0b000000111111) == 0){
		const ncx = cx-1&0x3FFFFFF
		void (ncx==cachex&cy==cachey ? cachec : world.get(ncx+cy*0x4000000))?.blockupdates.add(pos&0b111111000000)
	}else blockupdates.add(pos-1)
	if((pos >> 6) == 0b000000111111){
		const ncy = cy+1&0x3FFFFFF
		void (cx==cachex&ncy==cachey ? cachec : world.get(cx+ncy*0x4000000))?.blockupdates.add(pos&0b000000111111)
	}else blockupdates.add(pos+64)
	if((pos >> 6) == 0){
		const ncy = cy-1&0x3FFFFFF
		void (cx==cachex&ncy==cachey ? cachec : world.get(cx+ncy*0x4000000))?.blockupdates.add(pos|0b111111000000)
	}else blockupdates.add(pos-64)
	blockupdates.add(pos)
	return bl
}

let gridEventId = 0
export function blockevent(ev, fn){
	if(!chunk || !ev) return
	for(const {tbuf} of chunk.sockets){
		tbuf.byte(ev)
		if(ev == 255) tbuf.byte(0)
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

export function summon(fn){
	const e = fn()
	e.place(world, ((cx << 6) | (pos & 0b000000111111)) + .5, cy << 6 | pos >> 6)
	return e
}

export const peek = () => {const b=chunk?chunk[pos]:0;return b==65535?chunk.tileData.get(pos):BlockIDs[b]}

// V8, I beg you, please inline!
function nc(x,y){if(x==cachex&y==cachey){cachex=cx;cachey=cy;cx=x;cy=y;const c=cachec;cachec=chunk;chunk=c}else{cachex=cx;cachey=cy;cachec=chunk;chunk=world.get((cx=x)+(cy=y)*0x4000000)}}
function npeek(x,y,p){if(x==cachex&y==cachey){const b=cachec?cachec[p]:0;return b==65535?cachec.tileData.get(pos):BlockIDs[b]}else{const c=world.get(x+y*0x4000000);const b=c?c[p]:0;return b==65535?c.tileData.get(pos):BlockIDs[b]}}

export function left(){
	if(pos & 0b000000111111){ pos--; return }
	pos |= 0b000000111111; nc(cx-1 & 0x3FFFFFF, cy)
}
export function right(){
	if((pos & 0b000000111111) != 0b000000111111){ pos++; return }
	pos &= 0b111111000000; nc(cx+1 & 0x3FFFFFF, cy)
}
export function down(){
	if(pos & 0b111111000000){ pos -= 64; return }
	pos |= 0b111111000000; nc(cx, cy-1 & 0x3FFFFFF)
}
export function up(){
	if((pos & 0b111111000000) != 0b111111000000){ pos += 64; return }
	pos &= 0b000000111111; nc(cx, cy+1 & 0x3FFFFFF)
}

export function peekleft(){
	if(pos & 0b000000111111){const b=chunk?chunk[pos-1]:0;return b==65535?chunk.tileData.get(pos-1):BlockIDs[b]}
	return npeek(cx-1 & 0x3FFFFFF, cy, pos | 0b000000111111)
}
export function peekright(){
	if((pos & 0b000000111111) != 0b000000111111){const b=chunk?chunk[pos+1]:0;return b==65535?chunk.tileData.get(pos+1):BlockIDs[b]}
	return npeek(cx+1 & 0x3FFFFFF, cy, pos & 0b111111000000)
}
export function peekdown(){
	if(pos & 0b111111000000){const b=chunk?chunk[pos-64]:0;return b==65535?chunk.tileData.get(pos-64):BlockIDs[b]}
	return npeek(cx,cy-1 & 0x3FFFFFF, pos | 0b111111000000)
}
export function peekup(){
	if((pos & 0b111111000000) != 0b111111000000){const b=chunk?chunk[pos+64]:0;return b==65535?chunk.tileData.get(pos+64):BlockIDs[b]}
	return npeek(cx,cy+1 & 0x3FFFFFF, pos & 0b000000111111)
}

export function jump(dx, dy){
	dx = (pos & 0b000000111111) + dx | 0; dy = (pos >> 6) + dy | 0
	if((dx | dy) >>> 6){ nc(cx + (dx >>> 6) & 0x3FFFFFF, cy + (dy >>> 6) & 0x3FFFFFF); pos = (dx & 0b000000111111) | (dy & 0b000000111111) << 6; return }
	pos = dx | dy << 6
}

export function peekat(dx, dy){
	const nx = (pos & 0b000000111111) + dx, ny = (pos >> 6) + dy
	if(!((nx | ny) >>> 6) && chunk){const b=chunk?chunk[nx|ny<<6]:0;return b==65535?chunk.tileData.get(nx|ny<<6):BlockIDs[b]}
	const c = world.get((cx + (nx >>> 6) & 0x3FFFFFF) + (cy + (ny >>> 6) & 0x3FFFFFF) * 0x4000000)
	const i = (nx & 0b000000111111) | (ny & 0b000000111111) << 6
	const b = c?c[i]:0
	return b==65535?c.tileData.get(i):BlockIDs[b]
}

export function select(x0, y0, x1, y1, cb){
	x0 += cx<<6|(pos&0b000000111111); x1 += (cx<<6|(pos&0b000000111111)) + 1
	y0 += cy<<6|pos>>6; y1 += (cy<<6|pos>>6) + 1
	const cx0 = floor(x0) >>> 6, cx1 = ceil(x1 / 64) & 0x3FFFFFF
	const cy0 = floor(y0) >>> 6, cy1 = ceil(y1 / 64) & 0x3FFFFFF
	let i = 0
	for(let cxa = cx0; cxa != cx1; cxa = cxa + 1 & 0x3FFFFFF){
		for(let cya = cy0; cya != cy1; cya = cya + 1 & 0x3FFFFFF){
			const ch = (cxa == cx & cya == cy) && chunk || world.get(cxa+cya*0x4000000)
			if(!ch || !ch.entities) continue
			for(const e2 of ch.entities){
				if((e2.state&0x8000 | !e2.world) || (e2.x < x0 | e2.x > x1) || (e2.y < y0 | e2.y > y1)) continue
				cb(e2)
			}
		}
	}
}

optimize(nc, npeek, place, goto, peek, jump, peekat, right, left, up, down, peekright, peekleft, peekup, peekdown, summon, gridevent, cancelgridevent, select)
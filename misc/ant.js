import { Blocks } from '../blocks/block.js'
import { optimize } from '../internals.js'

// TODO: wasm

let cx = 0, cy = 0, pos = 0
let chunk = undefined
let world = null
// Our functions run on so little overhead that array or map caching becomes a big burden for close-together world access
let cachec = undefined, cachex = 0, cachey = 0

export function gotozero(w){
	cx = cy = pos = 0
	cachec = undefined; cachex = cachey = 67108864;
	chunk = (world = w).get(0)
}

export function goto(x, y, w){
	cx = x >>> 6; cy = y >>> 6; world = w; pos = (x & 63) | (y & 63) << 6
	cachec = undefined; cachex = cachey = 67108864;
	chunk = world.get(cx+cy*67108864)
}
export function place(block){
	if(!chunk) return
	if(typeof block == 'function') chunk.tiles[pos] = block()
	else chunk.tiles[pos] = block
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(0)
		tbuf.int(cx << 6 | (pos&63))
		tbuf.int(cy << 6 | (pos>>6))
		tbuf.short(block.id)
		if(block.savedata) tbuf.write(block.savedata, chunk.tiles[pos])
	}
}
let blockEventId = 0
export function blockevent(ev, id = (blockEventId = blockEventId + 1 | 0) || (blockEventId = 1)){
	if(!chunk || !ev) return
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(ev)
		tbuf.int(cx << 6 | (pos&63))
		tbuf.int(cy << 6 | (pos>>6))
		tbuf.int(id)
	}
	return id
}
export function cancelblockevent(id){
	if(!chunk || !id) return
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(255)
		tbuf.int(id)
	}
}

export const peek = () => chunk ? chunk.tiles[pos] : Blocks.air

// V8, I beg you please inline!
function nc(x,y){if(x==cachex&&y==cachey){cachex=cx;cachey=cy;cx=x;cy=y;const c=cachec;cachec=chunk;chunk=c}else{cachex=cx;cachey=cy;cachec=chunk;chunk=world.get((cx=x)+(cy=y)*67108864)}}
function npeek(x,y,p){if(x==cachex&&y==cachey)return cachec?cachec.tiles[p]:Blocks.air;else{const c=world.get(x+y*67108864);return c?c.tiles[p]:Blocks.air}}
function nput(x,y,p,b){const c=x==cachex&&y==cachey?cachec:world.get(x+y*67108864);if(!c)return;if(typeof b=='function')c.tiles[p]=b();else c.tiles[p]=b;for(const {sock:{tbuf:t}} of c.players){t.byte(0);t.int(cx<<6|(p&63));t.int(cy<<6|(p>>6));t.short(b.id);if(b.savedata)t.write(b.savedata,c.tiles[p])}}

export function left(){
	if(pos & 63){ pos--; return }
	pos |= 63; nc(cx-1 & 67108863, cy)
}
export function right(){
	if((pos & 63) != 63){ pos++; return }
	pos &= 4032; nc(cx+1 & 67108863, cy)
}
export function down(){
	if(pos & 4032){ pos -= 64; return }
	pos |= 4032; nc(cx, cy-1 & 67108863)
}
export function up(){
	if((pos & 4032) != 4032){ pos += 64; return }
	pos &= 63; nc(cx, cy+1 & 67108863)
}

export function peekleft(){
	if(pos & 63) return chunk ? chunk.tiles[pos - 1] : Blocks.air
	return npeek(cx-1 & 67108863, cy, pos | 63)
}
export function peekright(){
	if((pos & 63) != 63) return chunk ? chunk.tiles[pos + 1] : Blocks.air
	return npeek(cx+1 & 67108863, cy, pos & 4032)
}
export function peekdown(){
	if(pos & 4032) return chunk ? chunk.tiles[pos - 64] : Blocks.air
	return npeek(cx,cy-1 & 67108863, pos | 4032)
}
export function peekup(){
	if((pos & 4032) != 4032)return chunk ? chunk.tiles[pos + 64] : Blocks.air
	return npeek(cx,cy+1 & 67108863, pos & 63)
}

export function placeleft(block){
	if(pos & 63){
		if(!chunk)return
		if(typeof block == 'function') chunk.tiles[pos-1] = block()
		else chunk.tiles[pos-1] = block
		for(const {sock: {tbuf}} of chunk.players){
			tbuf.byte(0)
			tbuf.int(cx << 6 | (pos&63)-1)
			tbuf.int(cy << 6 | (pos>>6))
			tbuf.short(block.id)
			if(block.savedata) tbuf.write(block.savedata, chunk.tiles[pos-1])
		}
	}
	return nput(cx-1 & 67108863, cy, pos | 63, block)
}
export function placeright(block){
	if((pos & 63) != 63){
		if(!chunk)return
		if(typeof block == 'function') chunk.tiles[pos+1] = block()
		else chunk.tiles[pos+1] = block
		for(const {sock: {tbuf}} of chunk.players){
			tbuf.byte(0)
			tbuf.int(cx << 6 | (pos&63)+1)
			tbuf.int(cy << 6 | (pos>>6))
			tbuf.short(block.id)
			if(block.savedata) tbuf.write(block.savedata, chunk.tiles[pos+1])
		}
	}
	return nput(cx+1 & 67108863, cy, pos & 4032, block)
}
export function placedown(block){
	if(pos & 4032){
		if(!chunk)return
		if(typeof block == 'function') chunk.tiles[pos-64] = block()
		else chunk.tiles[pos-64] = block
		for(const {sock: {tbuf}} of chunk.players){
			tbuf.byte(0)
			tbuf.int(cx << 6 | (pos&63))
			tbuf.int(cy << 6 | (pos>>6)-1)
			tbuf.short(block.id)
			if(block.savedata) tbuf.write(block.savedata, chunk.tiles[pos-64])
		}
	}
	return nput(cx,cy-1 & 67108863, pos | 4032, block)
}
export function placeup(block){
	if((pos & 4032) != 4032){
		if(!chunk)return
		if(typeof block == 'function') chunk.tiles[pos+64] = block()
		else chunk.tiles[pos+64] = block
		for(const {sock: {tbuf}} of chunk.players){
			tbuf.byte(0)
			tbuf.int(cx << 6 | (pos&63))
			tbuf.int(cy << 6 | (pos>>6)+1)
			tbuf.short(block.id)
			if(block.savedata) tbuf.write(block.savedata, chunk.tiles[pos+64])
		}
	}
	return nput(cx,cy+1 & 67108863, pos & 63, block)
}

export function jump(dx, dy){
	dx = (pos & 63) + dx | 0; dy = (pos >> 6) + dy | 0
	if((dx | dy) >>> 6){ nc(cx + (dx >>> 6) & 67108863, cy + (dy >>> 6) & 67108863); pos = (dx & 63) | (dy & 63) << 6; return }
	pos = dx | dy << 6
}

export function peekat(dx, dy){
	const nx = (pos & 63) + dx, ny = (pos >> 6) + dy
	if(!((nx | ny) >>> 6) && chunk)return chunk.tiles[nx | ny << 6]
	const c = world.get((cx + (nx >>> 6) & 67108863) + (cy + (ny >>> 6) & 67108863) * 67108864)
	return c ? c.tiles[(nx & 63) | (ny & 63) << 6] : Blocks.air
}
export function placeat(dx, dy, block){
	const nx = (pos & 63) + dx, ny = (pos >> 6) + dy
	if((nx | ny) >>> 6)return nput(cx + (nx >>> 6) & 67108863, cy + (ny >>> 6) & 67108863, (nx & 63) | (ny & 63) << 6, block)
	if(!chunk)return
	dx = nx | ny << 6
	if(typeof block == 'function') chunk.tiles[dx] = block()
	else chunk.tiles[dx] = block
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(0)
		tbuf.int(cx << 6 | (dx&63))
		tbuf.int(cy << 6 | (dx>>6))
		tbuf.short(block.id)
		if(block.savedata) tbuf.write(block.savedata, chunk.tiles[dx])
	}
}


optimize(nc, npeek, nput, place, goto, peek, jump, peekat, placeat, right, left, up, down, peekright, peekleft, peekup, peekdown, placeright, placeleft, placeup, placedown)
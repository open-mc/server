import { Blocks } from '../blocks/block.js'
import { Entities } from '../entities/entity.js'
import { optimize } from '../internals.js'
import { Item } from '../items/item.js'

// TODO: wasm

let cx = 0, cy = 0, pos = 0
let tiles = undefined, chunk = undefined
let world = null
// Our functions run on so little overhead that array or map caching becomes a big burden for close-together world access
let cachet = undefined, cachec = undefined, cachex = 0, cachey = 0

export const getX = () => cx<<6|(pos&63)
export const getY = () => cy<<6|pos>>6

export function gotozero(w){
	cx = cy = pos = 0
	cachet = cachec = undefined; cachex = cachey = 67108864
	chunk = (world = w).get(0); tiles = chunk?.tiles
}

export function goto(x, y, w){
	cx = x >>> 6; cy = y >>> 6; world = w; pos = (x & 63) | (y & 63) << 6
	cachet = undefined; cachex = cachey = 67108864;
	chunk = world.get(cx+cy*67108864); tiles = chunk?.tiles
}
export function place(block){
	if(!tiles) return
	if(typeof block == 'function') tiles[pos] = block()
	else tiles[pos] = block
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(0)
		tbuf.int(cx << 6 | (pos&63))
		tbuf.int(cy << 6 | (pos>>6))
		tbuf.short(block.id)
		if(block.savedata) tbuf.write(block.savedata, tiles[pos])
	}
}
export function destroy(){
	if(!tiles) return
	const drop = tiles[pos].drops?.(null)
	if(drop instanceof Item){
		const itm = Entities.item(cx<<6|(pos&63), cy<<6|pos>>6)
		itm.item = drop
		itm.dx = random() * 6 - 3
		itm.dy = 6
		itm.place(world)
	}else if(drop instanceof Array){
		for(const d of drop){
			const itm = Entities.item(cx<<6|(pos&63), cy<<6|pos>>6)
			itm.item = d
			itm.dx = random() * 6 - 3
			itm.dy = 6
			itm.place(world)
		}
	}
	tiles[pos] = Blocks.air()
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(0)
		tbuf.int(cx << 6 | (pos&63))
		tbuf.int(cy << 6 | (pos>>6))
		tbuf.short(Blocks.air.id)
	}
}
let blockEventId = 0
export function blockevent(ev, id = (blockEventId = blockEventId + 1 | 0) || (blockEventId = 1)){
	if(!tiles || !ev) return
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(ev)
		tbuf.int(cx << 6 | (pos&63))
		tbuf.int(cy << 6 | (pos>>6))
		tbuf.int(id)
	}
	return id
}
export function cancelblockevent(id){
	if(!tiles || !id) return
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(255)
		tbuf.int(id)
	}
}

export function summon(fn){
	const e = fn(((cx << 6) | (pos & 63)) + .5, cy << 6 | pos >> 6)
	e.place(world)
	return e
}

export const peek = () => tiles ? tiles[pos] : Blocks.air

// V8, I beg you please inline!
function nc(x,y){if(x==cachex&&y==cachey){cachex=cx;cachey=cy;cx=x;cy=y;const t=cachet,c=cachec;cachet=tiles;cachec=chunk;tiles=t;chunk=c}else{cachex=cx;cachey=cy;cachet=tiles;cachec=chunk;chunk=world.get((cx=x)+(cy=y)*67108864);tiles=chunk?.tiles}}
function npeek(x,y,p){if(x==cachex&&y==cachey)return cachet?cachet[p]:Blocks.air;else{const c=world.get(x+y*67108864),t=c?.tiles;return t?t[p]:Blocks.air}}
function nput(x,y,p,b){const c=x==cachex&&y==cachey?cachec:world.get(x+y*67108864),t=c?.tiles;if(!t)return;if(typeof b=='function')t[p]=b();else t[p]=b;for(const {sock:{tbuf:tb}} of c.players){tb.byte(0);tb.int(cx<<6|(p&63));tb.int(cy<<6|(p>>6));tb.short(b.id);if(b.savedata)tb.write(b.savedata,t[p])}}

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
	if(pos & 63) return tiles ? tiles[pos - 1] : Blocks.air
	return npeek(cx-1 & 67108863, cy, pos | 63)
}
export function peekright(){
	if((pos & 63) != 63) return tiles ? tiles[pos + 1] : Blocks.air
	return npeek(cx+1 & 67108863, cy, pos & 4032)
}
export function peekdown(){
	if(pos & 4032) return tiles ? tiles[pos - 64] : Blocks.air
	return npeek(cx,cy-1 & 67108863, pos | 4032)
}
export function peekup(){
	if((pos & 4032) != 4032)return tiles ? tiles[pos + 64] : Blocks.air
	return npeek(cx,cy+1 & 67108863, pos & 63)
}

export function placeleft(block){
	if(pos & 63){
		if(!tiles)return
		if(typeof block == 'function') tiles[pos-1] = block()
		else tiles[pos-1] = block
		for(const {sock: {tbuf}} of chunk.players){
			tbuf.byte(0)
			tbuf.int(cx << 6 | (pos&63)-1)
			tbuf.int(cy << 6 | (pos>>6))
			tbuf.short(block.id)
			if(block.savedata) tbuf.write(block.savedata, tiles[pos-1])
		}
	}
	return nput(cx-1 & 67108863, cy, pos | 63, block)
}
export function placeright(block){
	if((pos & 63) != 63){
		if(!tiles)return
		if(typeof block == 'function') tiles[pos+1] = block()
		else tiles[pos+1] = block
		for(const {sock: {tbuf}} of chunk.players){
			tbuf.byte(0)
			tbuf.int(cx << 6 | (pos&63)+1)
			tbuf.int(cy << 6 | (pos>>6))
			tbuf.short(block.id)
			if(block.savedata) tbuf.write(block.savedata, tiles[pos+1])
		}
	}
	return nput(cx+1 & 67108863, cy, pos & 4032, block)
}
export function placedown(block){
	if(pos & 4032){
		if(!tiles)return
		if(typeof block == 'function') tiles[pos-64] = block()
		else tiles[pos-64] = block
		for(const {sock: {tbuf}} of chunk.players){
			tbuf.byte(0)
			tbuf.int(cx << 6 | (pos&63))
			tbuf.int(cy << 6 | (pos>>6)-1)
			tbuf.short(block.id)
			if(block.savedata) tbuf.write(block.savedata, tiles[pos-64])
		}
	}
	return nput(cx,cy-1 & 67108863, pos | 4032, block)
}
export function placeup(block){
	if((pos & 4032) != 4032){
		if(!tiles)return
		if(typeof block == 'function') tiles[pos+64] = block()
		else tiles[pos+64] = block
		for(const {sock: {tbuf}} of chunk.players){
			tbuf.byte(0)
			tbuf.int(cx << 6 | (pos&63))
			tbuf.int(cy << 6 | (pos>>6)+1)
			tbuf.short(block.id)
			if(block.savedata) tbuf.write(block.savedata, tiles[pos+64])
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
	if(!((nx | ny) >>> 6) && tiles)return tiles[nx | ny << 6]
	const c = world.get((cx + (nx >>> 6) & 67108863) + (cy + (ny >>> 6) & 67108863) * 67108864), t = c?.tiles
	return t ? t[(nx & 63) | (ny & 63) << 6] : Blocks.air
}
export function placeat(dx, dy, block){
	const nx = (pos & 63) + dx, ny = (pos >> 6) + dy
	if((nx | ny) >>> 6)return nput(cx + (nx >>> 6) & 67108863, cy + (ny >>> 6) & 67108863, (nx & 63) | (ny & 63) << 6, block)
	if(!tiles)return
	dx = nx | ny << 6
	if(typeof block == 'function') tiles[dx] = block()
	else tiles[dx] = block
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(0)
		tbuf.int(cx << 6 | (dx&63))
		tbuf.int(cy << 6 | (dx>>6))
		tbuf.short(block.id)
		if(block.savedata) tbuf.write(block.savedata, tiles[dx])
	}
}


optimize(nc, npeek, nput, place, goto, peek, jump, peekat, placeat, right, left, up, down, peekright, peekleft, peekup, peekdown, placeright, placeleft, placeup, placedown, summon, blockevent, cancelblockevent)
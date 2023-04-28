import { Blocks } from '../blocks/block.js'
import { Entities } from '../entities/entity.js'
import { optimize } from '../internals.js'
import { Item } from '../items/item.js'

// TODO: wasm

let cx = 0, cy = 0, pos = 0
let tiles = undefined, chunk = undefined
export let world = null
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
	if(typeof x == 'object')w=x.world,y=floor(x.y)|0,x=floor(x.x)|0
	cx = x >>> 6; cy = y >>> 6; world = w; pos = (x & 63) | (y & 63) << 6
	cachet = undefined; cachex = cachey = 67108864;
	chunk = world.get(cx+cy*67108864); tiles = chunk?.tiles
}
export function place(bl){
	if(!tiles) return bl()
	const block = tiles[pos] = bl()
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(0)
		tbuf.int(cx << 6 | (pos&63))
		tbuf.int(cy << 6 | (pos>>6))
		tbuf.short(block.id)
		if(block.savedata) tbuf.write(block.savedata, block)
	}
	return block
}
export function destroy(){
	if(!tiles) return
	if(tiles[pos].destroyed?.()) return
	const tile = tiles[pos]
	tiles[pos] = Blocks.air()
	const drop = tile.drops?.()
	if(drop instanceof Item){
		const itm = Entities.item()
		itm.item = drop
		itm.dx = random() * 6 - 3
		itm.dy = 6
		itm.place(world, cx<<6|(pos&63), cy<<6|pos>>6)
	}else if(drop instanceof Array){
		for(const d of drop){
			const itm = Entities.item()
			itm.item = d
			itm.dx = random() * 6 - 3
			itm.dy = 6
			itm.place(world, cx<<6|(pos&63), cy<<6|pos>>6)
		}
	}
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(0)
		tbuf.int(cx << 6 | (pos&63))
		tbuf.int(cy << 6 | (pos>>6))
		tbuf.short(Blocks.air.id)
	}
}
let gridEventId = 0
export function blockevent(ev, fn){
	if(!tiles || !ev) return
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(ev)
		if(ev == 255) tbuf.byte(0)
		tbuf.int(cx << 6 | (pos&63))
		tbuf.int(cy << 6 | (pos>>6))
		if(fn) fn(tbuf)
	}
}
export function gridevent(ev, fn){
	if(!tiles || !ev) return
	const id = (gridEventId = gridEventId + 1 | 0) || (gridEventId = 1)
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.short(65280|ev)
		tbuf.int(cx << 6 | (pos&63))
		tbuf.int(cy << 6 | (pos>>6))
		tbuf.int(id)
		if(fn) fn(tbuf)
	}
	return id
}
export function cancelgridevent(id){
	if(!tiles || !id) return
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.short(65535)
		tbuf.int(id)
	}
}

export function summon(fn){
	const e = fn()
	e.place(world, ((cx << 6) | (pos & 63)) + .5, cy << 6 | pos >> 6)
	return e
}

export const peek = () => tiles ? tiles[pos] : Blocks.air

// V8, I beg you please inline!
function nc(x,y){if(x==cachex&&y==cachey){cachex=cx;cachey=cy;cx=x;cy=y;const t=cachet,c=cachec;cachet=tiles;cachec=chunk;tiles=t;chunk=c}else{cachex=cx;cachey=cy;cachet=tiles;cachec=chunk;chunk=world.get((cx=x)+(cy=y)*67108864);tiles=chunk?.tiles}}
function npeek(x,y,p){if(x==cachex&&y==cachey)return cachet?cachet[p]:Blocks.air;else{const c=world.get(x+y*67108864),t=c?.tiles;return t?t[p]:Blocks.air}}
function nput(x,y,p,b){const c=x==cachex&&y==cachey?cachec:world.get(x+y*67108864),t=c?.tiles;if(!t)return b;t[p]=b;for(const {sock:{tbuf:tb}} of c.players){tb.byte(0);tb.int(cx<<6|(p&63));tb.int(cy<<6|(p>>6));tb.short(b.id);if(b.savedata)tb.write(b.savedata,t[p])}return b}

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

export function placeleft(bl){
	if(pos & 63){
		if(!tiles)return bl()
		const block = tiles[pos-1] = bl()
		for(const {sock: {tbuf}} of chunk.players){
			tbuf.byte(0)
			tbuf.int(cx << 6 | (pos&63)-1)
			tbuf.int(cy << 6 | (pos>>6))
			tbuf.short(block.id)
			if(block.savedata) tbuf.write(block.savedata, block)
		}
		return block
	}
	return nput(cx-1 & 67108863, cy, pos | 63, bl())
}
export function placeright(bl){
	if((pos & 63) != 63){
		if(!tiles)return bl()
		const block = tiles[pos+1] = bl()
		for(const {sock: {tbuf}} of chunk.players){
			tbuf.byte(0)
			tbuf.int(cx << 6 | (pos&63)+1)
			tbuf.int(cy << 6 | (pos>>6))
			tbuf.short(block.id)
			if(block.savedata) tbuf.write(block.savedata, block)
		}
		return block
	}
	return nput(cx+1 & 67108863, cy, pos & 4032, bl())
}
export function placedown(bl){
	if(pos & 4032){
		if(!tiles)return bl()
		const block = tiles[pos-64] = bl()
		for(const {sock: {tbuf}} of chunk.players){
			tbuf.byte(0)
			tbuf.int(cx << 6 | (pos&63))
			tbuf.int(cy << 6 | (pos>>6)-1)
			tbuf.short(block.id)
			if(block.savedata) tbuf.write(block.savedata, block)
		}
		return block
	}
	return nput(cx,cy-1 & 67108863, pos | 4032, bl())
}
export function placeup(bl){
	if((pos & 4032) != 4032){
		if(!tiles)return bl()
		const block = tiles[pos+64] = bl()
		for(const {sock: {tbuf}} of chunk.players){
			tbuf.byte(0)
			tbuf.int(cx << 6 | (pos&63))
			tbuf.int(cy << 6 | (pos>>6)+1)
			tbuf.short(block.id)
			if(block.savedata) tbuf.write(block.savedata, block)
		}
		return block
	}
	return nput(cx,cy+1 & 67108863, pos & 63, bl())
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
export function placeat(dx, dy, bl){
	const nx = (pos & 63) + dx, ny = (pos >> 6) + dy
	if((nx | ny) >>> 6)return nput(cx + (nx >>> 6) & 67108863, cy + (ny >>> 6) & 67108863, (nx & 63) | (ny & 63) << 6, bl())
	if(!tiles)return bl()
	dx = nx | ny << 6
	const block = tiles[dx] = bl()
	for(const {sock: {tbuf}} of chunk.players){
		tbuf.byte(0)
		tbuf.int(cx << 6 | (dx&63))
		tbuf.int(cy << 6 | (dx>>6))
		tbuf.short(block.id)
		if(block.savedata) tbuf.write(block.savedata, block)
	}
	return block
}

export function select(x0, y0, x1, y1, cb){
	x0 += cx<<6|(pos&63); x1 += (cx<<6|(pos&63)) + 1
	y0 += cy<<6|pos>>6; y1 += (cy<<6|pos>>6) + 1
	const cx0 = floor(x0) >>> 6, cx1 = ceil(x1 / 64) & 67108863
	const cy0 = floor(y0) >>> 6, cy1 = ceil(y1 / 64) & 67108863
	let i = 0
	for(let cxa = cx0; cxa != cx1; cxa = cxa + 1 & 67108863){
		for(let cya = cy0; cya != cy1; cya = cya + 1 & 67108863){
			const ch = (cxa == cx & cya == cy) && chunk || world.get(cxa+cya*67108864)
			if(!ch || !ch.entities) continue
			for(const e2 of ch.entities){
				if(e2.x < x0 || e2.x > x1 || e2.y < y0 || e2.y > y1) continue
				cb(e2)
			}
		}
	}
}

optimize(nc, npeek, nput, place, goto, peek, jump, peekat, placeat, right, left, up, down, peekright, peekleft, peekup, peekdown, placeright, placeleft, placeup, placedown, summon, gridevent, cancelgridevent, select)
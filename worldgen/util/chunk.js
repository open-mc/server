import { DataWriter } from '../../modules/dataproto.js'
import { chunk, findBiome } from './outer-noise.js'
import { _biomeArr, Biomes, BlockIDs, Blocks } from '../globals.js'

export { chunk }
let i = 0, x = 0, y = 0
let cx=0,cy=0,bSeed=0,rootBiome=0
export const airBlockArrays = [null,null,null,null,null,null,null,null,null]
export const groundBlockArrays = [null,null,null,null,null,null,null,null,null]
export const _setChunkPos = (x,y,bs,b) => {cx=x;cy=y;bSeed=bs;rootBiome=b}
export const goto = j => {i=j;x=j&63;y=j>>6}
export const up = () => {y++}
export const down = () => {y--}
export const right = () => {x++}
export const left = () => {x--}
export const jump = (dx,dy)=>{x+=dx;y+=dy}
export const getX = () => cx+x|0
export const getY = () => cy+y|0
export const peekNoise = () => {
	const x1=x+64>>>0,y1=y+64>>>0
	if(x1>191||y1>191) return false
	return (_noiseChunks[(x1>>6)+(y1>>6)*3][x1>>3&7|(y1&63)<<3]>>(x1&7)&1)!=0
}
export const peekAirType = () => {
	const i = y+256>>>6, i1 = (y&63)*3
	if(i > 8) return Blocks.air
	const aba = airBlockArrays[i], r = aba[i1]
	return BlockIDs[aba[(r?i1+((hash3(bSeed, cx+x|0, cy+y|0)&0xff) < r):i1)+1]]
}
export const peekGroundType = () => {
	const i = y+256>>>6, i1 = (y&63)*3
	if(i > 8) return Blocks.air
	const aba = groundBlockArrays[i], r = aba[i1]
	return BlockIDs[aba[(r?i1+((hash3(bSeed, cx+x|0, cy+y|0)&0xff) < r):i1)+1]]
}
export const peekBiome = () => {
	const i = y+256>>>6, j = x+256>>>6, i1 = (y&63)*3
	if(i > 8 || j > 8) return Biomes.void
	const aba = airBlockArrays[i], r = aba[i1]
	const block = aba[(r?i1+(hash3(bSeed, cx+x|0, cy+y|0)&0xff < r):i1)+1]
	const bda = _biomeChunks[j+i*9]
	const i0 = (x>>4&3) + (y>>4&3)*5
	const xf0 = (x&15)*.0625, xf = (3-xf0-xf0)*xf0*xf0
	const yf0 = (y&15)*.0625, yf = (3-yf0-yf0)*yf0*yf0
	const a = bda[i0+25], b = bda[i0+30]
	const a1 = a + (bda[i0+26]-a)*xf
	const t = a1 + ((b + (bda[i0+31]-b)*xf)-a1)*yf
	const c = bda[i0+50], d = bda[i0+55]
	const c1 = c + (bda[i0+51]-c)*xf
	const h = c1 + ((d + (bda[i0+56]-d)*xf)-c1)*yf
	return _biomeArr[findBiome(rootBiome, t, h, block)]
}
export const blockUpdates = []
export const peek = () => BlockIDs[chunk[y<<6|x|(x&-64)<<6]??0]
export const place = b => {chunk[y<<6|x|(x&-64)<<6]=b.id}
export const cmpxchg = (ob,b) => {const i=y<<6|x|(x&-64)<<6;if(chunk[i]==ob.id)chunk[i]=b.id}
export const placeat = (dx=0,dy=0,b) => {chunk[y+dy<<6|x+dx|(x+dx&-64)<<6]=b.id}
export const placeup = b => {chunk[y+1<<6|x|(x&-64)<<6]=b.id}
export const placedown = b => {chunk[y-1<<6|x|(x&-64)<<6]=b.id}
export const placeright = b => {chunk[y<<6|x+1|(x+1&-64)<<6]=b.id}
export const placeleft = b => {chunk[y-1<<6|x-1|(x-1&-64)<<6]=b.id}
export const blockupdate = (dx=0,dy=0) => {
	const i = y+dy<<6|x+dx|(x+dx&-64)<<6
	if(i>>12) return
	blockUpdates.push(i)
}

export const tileData = new Map()
export const biomeData = new Uint8Array(10)
let PM
export const _setPm = a => { PM = new Uint16Array(a).fill(0x0100) }
export function toBuf(buf = new DataWriter()){
	let palette = [], paletteFull = []
	const IDs = chunk.slice(0)
	for(let i = 0; i < 4096; i++){
		let id = chunk[i]
		if(id === 65535) IDs[i] = id = tileData.get(i).id
		const a = PM[id]
		if(a < 0x0100) continue
		if(a > 0x0100){
			if(a < 0x010A){ PM[id] = a+1; continue }
			PM[id] = palette.push(id)-1
			if(palette.length+(palette.length!=paletteFull.length) == 256){ palette.length = 0; break }
		}else if(palette.length != 255) PM[id] = 0x0101, paletteFull.push(id)
		else{ palette.length = 0; break }
	}
	let lastId = -1
	for(const p of paletteFull)
		if(PM[p]>=0x0100) PM[p] = palette.length, lastId = 0
	if(!lastId) lastId = palette.push(65535)-1
	try{
		buf.flint(0)
		buf.short(blockUpdates.length)
		for(const b of blockUpdates) buf.short(b)
		buf.byte(palette.length - 1)
		buf.short(65535)
		for(const b of biomeData) buf.byte(b)

		//encode palette
		for(const p of palette) buf.short(p)

		//encode blocks
		if(palette.length == 1);
		else if(palette.length == 2){
			const u8 = new Uint8Array(512)
			for(let i = 0; i < 4096; i+=8)
				u8[i>>3] = (PM[IDs[i]] << 0)
				| (PM[IDs[i+1]] << 1)
				| (PM[IDs[i+2]] << 2)
				| (PM[IDs[i+3]] << 3)
				| (PM[IDs[i+4]] << 4)
				| (PM[IDs[i+5]] << 5)
				| (PM[IDs[i+6]] << 6)
				| (PM[IDs[i+7]] << 7)
			buf.uint8array(u8, 512)
		}else if(palette.length <= 4){
			const u8 = new Uint8Array(1024)
			for(let i = 0; i < 4096; i+=4)
				u8[i>>2] = PM[IDs[i]]
				| (PM[IDs[i+1]] << 2)
				| (PM[IDs[i+2]] << 4)
				| (PM[IDs[i+3]] << 6)
			buf.uint8array(u8, 1024)
		}else if(palette.length <= 16){
			const u8 = new Uint8Array(2048)
			for(let i = 0; i < 4096; i+=2)
				u8[i>>1] = PM[IDs[i]] | (PM[IDs[i+1]] << 4)
			buf.uint8array(u8, 2048)
		}else{
			const u8 = new Uint8Array(4096)
			for(let i = 0; i < 4096; i++) u8[i] = PM[IDs[i]]
			buf.uint8array(u8, 4096)
		}

		//save block entities
		for(let i = 0; i < 4096; i++){
			if(PM[IDs[i]] === lastId) buf.short(IDs[i])
			if(chunk[i] != 65535) continue
			const tile = tileData.get(i)
			buf.flint(tile.savedatahistory.length)
			buf.write(tile.savedata, tile)
		}
	}finally{
		for(const p of paletteFull) PM[p] = 0x0100
	}
	tileData.clear()
	blockUpdates.length = 0
	return buf
}

Function.optimizeImmediately(toBuf)

export class NoiseChunk extends Uint8Array{
	constructor(a, b){ super(b); this.expires = a + 900e3 }
}
export class BiomeChunk extends Float32Array{
	uniform = null
	constructor(a){ super(75); this.expires = a + 3600e3 }
}

export const _biomeChunks = Array.null(81), _noiseChunks = Array.null(9)
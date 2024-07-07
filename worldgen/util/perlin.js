import { Blocks, chunk } from '../vars.js'
import { imxs32, imxs32_2 } from './random.js'
import { constantBiome } from './biomes.js'

const low = new Float64Array(4160)
const high = new Float64Array(4160)
const sel = new Float64Array(4160)
const dep = new Float64Array(64)
const xlow = new Float64Array(17 * 17)
const ylow = new Float64Array(17 * 17)
const xhigh = new Float64Array(17 * 17)
const yhigh = new Float64Array(17 * 17)
const xsel = new Float64Array(17 * 17)
const ysel = new Float64Array(17 * 17)
const xdep = new Float64Array(17 * 17)
const ydep = new Float64Array(17 * 17)
function makeVector(i, int){
	if(int & 0x80){
		xlow[i] = int & 0x40 ? 1 : -1
		ylow[i] = (int & 0x3F) / 32 - (int & 0x40 ? 1 : 0.96875)
	}else{
		ylow[i] = int & 0x40 ? 1 : -1
		xlow[i] = (int & 0x3F) / 32 - (int & 0x40 ? 0.96875 : 1)
	}
	int >>= 8
	if(int & 0x80){
		xhigh[i] = int & 0x40 ? 1 : -1
		yhigh[i] = (int & 0x3F) / 32 - (int & 0x40 ? 1 : 0.96875)
	}else{
		yhigh[i] = int & 0x40 ? 1 : -1
		xhigh[i] = (int & 0x3F) / 32 - (int & 0x40 ? 0.96875 : 1)
	}
	int >>= 8
	if(int & 0x80){
		xsel[i] = int & 0x40 ? 1 : -1
		ysel[i] = (int & 0x3F) / 32 - (int & 0x40 ? 1 : 0.96875)
	}else{
		ysel[i] = int & 0x40 ? 1 : -1
		xsel[i] = (int & 0x3F) / 32 - (int & 0x40 ? 0.96875 : 1)
	}
	int >>= 8
	if(int & 0x80){
		xdep[i] = int & 0x40 ? 1 : -1
		ydep[i] = (int & 0x3F) / 32 - (int & 0x40 ? 1 : 0.96875)
	}else{
		ydep[i] = int & 0x40 ? 1 : -1
		xdep[i] = (int & 0x3F) / 32 - (int & 0x40 ? 0.96875 : 1)
	}
}
//3x^2 - 2x^3 polynomial lerp lookup table for i=0..<16 => x=0..<1
const lerpLookup = [
	      0, 0.01123046875, 0.04296875, 0.09228515625,
	0.15625, 0.23193359375, 0.31640625, 0.40673828125,
	    0.5, 0.59326171875, 0.68359375, 0.76806640625,
	0.84375, 0.90771484375, 0.95703125, 0.98876953125
]
const facs = new Float64Array(64)
const heights = new Float64Array(64)
const L = new Float64Array(16)

export const filler = (fill = Blocks.stone, liquid = Blocks.water, liquidSurface = Blocks.waterTop, level = 0, biomer, flags = 0) => (cx, cy) => {
	const biomes = typeof biomer == 'function' ? biomer(cx, cy) : constantBiome(biomer)
	let g = L[0] = imxs32_2(cx, cy); makeVector(0, g)
	for(let i = 1; i < 16; i++) makeVector(i, L[i]=g=imxs32(g,-150702732))
	for(let j = 0; j < 16; j++){
		g = L[j]
		for(let i = 17; i < 289; i+=17) makeVector(i+j, g=imxs32(g,1975484815))
	}
	makeVector(272, g = imxs32_2(cx, cy + 1))
	for(let i = 273; i < 288; i++) makeVector(i, g=imxs32(g,-150702732))
	makeVector(16, g = imxs32_2(cx + 1, cy))
	for(let i = 33; i < 288; i+=17) makeVector(i, g=imxs32(g,1975484815))
	makeVector(288, g = imxs32_2(cx + 1, cy + 1))
	for(let i = 0, px = .0078125, py = 0; i < 4160; i++,px+=.015625){if(px>=1) px=.0078125, py+=.015625
		let x = px, y = py
		let F = 4.849660523763336
		let l = 0, h = 0, s = 0
		let nx = x - 1, ny = y - 1, nnx = nx*nx, nny = ny*ny, xx = x*x, yy = y*y
		l += (((x * xlow[0] + y * ylow[0]) * nnx + (nx * xlow[16] + y * ylow[16]) * xx) * nny + ((x * xlow[272] + ny * ylow[272]) * nnx + (nx * xlow[288] + ny * ylow[288]) * xx) * yy) * F
		h += (((x * xhigh[0] + y * yhigh[0]) * nnx + (nx * xhigh[16] + y * yhigh[16]) * xx) * nny + ((x * xhigh[272] + ny * yhigh[272]) * nnx + (nx * xhigh[288] + ny * yhigh[288]) * xx) * yy) * F
		s += (((x * xsel[0] + y * ysel[0]) * nnx + (nx * xsel[16] + y * ysel[16]) * xx) * nny + ((x * xsel[272] + ny * ysel[272]) * nnx + (nx * xsel[288] + ny * ysel[288]) * xx) * yy) * F

		x *= 2; y *= 2
		let ixy = floor(x) * 8 + floor(y) * 136
		x %= 1; y %= 1; F *= .4
		nx = x - 1, ny = y - 1, nnx = nx*nx, nny = ny*ny, xx = x*x, yy = y*y
		l += (((x * xlow[ixy] + y * ylow[ixy]) * nnx + (nx * xlow[ixy+8] + y * ylow[ixy+8]) * xx) * nny + ((x * xlow[ixy+136] + ny * ylow[ixy+136]) * nnx + (nx * xlow[ixy+144] + ny * ylow[ixy+144]) * xx) * yy) * F
		h += (((x * xhigh[ixy] + y * yhigh[ixy]) * nnx + (nx * xhigh[ixy+8] + y * yhigh[ixy+8]) * xx) * nny + ((x * xhigh[ixy+136] + ny * yhigh[ixy+136]) * nnx + (nx * xhigh[ixy+144] + ny * yhigh[ixy+144]) * xx) * yy) * F
		s += (((x * xsel[ixy] + y * ysel[ixy]) * nnx + (nx * xsel[ixy+8] + y * ysel[ixy+8]) * xx) * nny + ((x * xsel[ixy+136] + ny * ysel[ixy+136]) * nnx + (nx * xsel[ixy+144] + ny * ysel[ixy+144]) * xx) * yy) * F

		x *= 2; y *= 2
		ixy += floor(x) * 4 + floor(y) * 68
		x %= 1; y %= 1; F *= .4
		nx = x - 1, ny = y - 1, nnx = nx*nx, nny = ny*ny, xx = x*x, yy = y*y
		l += (((x * xlow[ixy] + y * ylow[ixy]) * nnx + (nx * xlow[ixy+4] + y * ylow[ixy+4]) * xx) * nny + ((x * xlow[ixy+68] + ny * ylow[ixy+68]) * nnx + (nx * xlow[ixy+72] + ny * ylow[ixy+72]) * xx) * yy) * F
		h += (((x * xhigh[ixy] + y * yhigh[ixy]) * nnx + (nx * xhigh[ixy+4] + y * yhigh[ixy+4]) * xx) * nny + ((x * xhigh[ixy+68] + ny * yhigh[ixy+68]) * nnx + (nx * xhigh[ixy+72] + ny * yhigh[ixy+72]) * xx) * yy) * F
		s += (((x * xsel[ixy] + y * ysel[ixy]) * nnx + (nx * xsel[ixy+4] + y * ysel[ixy+4]) * xx) * nny + ((x * xsel[ixy+68] + ny * ysel[ixy+68]) * nnx + (nx * xsel[ixy+72] + ny * ysel[ixy+72]) * xx) * yy) * F

		x *= 2; y *= 2
		ixy += floor(x) * 2 + floor(y) * 34
		x %= 1; y %= 1; F *= .4
		nx = x - 1, ny = y - 1, nnx = nx*nx, nny = ny*ny, xx = x*x, yy = y*y
		l += (((x * xlow[ixy] + y * ylow[ixy]) * nnx + (nx * xlow[ixy+2] + y * ylow[ixy+2]) * xx) * nny + ((x * xlow[ixy+34] + ny * ylow[ixy+34]) * nnx + (nx * xlow[ixy+36] + ny * ylow[ixy+36]) * xx) * yy) * F
		h += (((x * xhigh[ixy] + y * yhigh[ixy]) * nnx + (nx * xhigh[ixy+2] + y * yhigh[ixy+2]) * xx) * nny + ((x * xhigh[ixy+34] + ny * yhigh[ixy+34]) * nnx + (nx * xhigh[ixy+36] + ny * yhigh[ixy+36]) * xx) * yy) * F
		s += (((x * xsel[ixy] + y * ysel[ixy]) * nnx + (nx * xsel[ixy+2] + y * ysel[ixy+2]) * xx) * nny + ((x * xsel[ixy+34] + ny * ysel[ixy+34]) * nnx + (nx * xsel[ixy+36] + ny * ysel[ixy+36]) * xx) * yy) * F

		x *= 2; y *= 2
		ixy += floor(x) + floor(y) * 17
		x %= 1; y %= 1; F *= .4
		nx = x - 1, ny = y - 1, nnx = nx*nx, nny = ny*ny, xx = x*x, yy = y*y
		l += (((x * xlow[ixy] + y * ylow[ixy]) * nnx + (nx * xlow[ixy+1] + y * ylow[ixy+1]) * xx) * nny + ((x * xlow[ixy+17] + ny * ylow[ixy+17]) * nnx + (nx * xlow[ixy+18] + ny * ylow[ixy+18]) * xx) * yy) * F
		h += (((x * xhigh[ixy] + y * yhigh[ixy]) * nnx + (nx * xhigh[ixy+1] + y * yhigh[ixy+1]) * xx) * nny + ((x * xhigh[ixy+17] + ny * yhigh[ixy+17]) * nnx + (nx * xhigh[ixy+18] + ny * yhigh[ixy+18]) * xx) * yy) * F
		s += (((x * xsel[ixy] + y * ysel[ixy]) * nnx + (nx * xsel[ixy+1] + y * ysel[ixy+1]) * xx) * nny + ((x * xsel[ixy+17] + ny * ysel[ixy+17]) * nnx + (nx * xsel[ixy+18] + ny * ysel[ixy+18]) * xx) * yy) * F

		low[i] = l; high[i] = h; sel[i] = s * 12.5 + .5
	}
	const biomeData = [0,0,0,0,0,0,0,0,0,0]
	let k = 0
	for(let i = 0; i < 5; i++){
		const {offset, height} = biomes[i]
		const o = biomeData[i] = typeof offset == 'function' ? offset(cx+i/4, cy) : offset
		const h = biomeData[i+5] = typeof height == 'function' ? height(cx+i/4, cy) : height
		if(o - abs(h) > (cy << 6)+96) k -= Math.sign(h)||Math.sign(1/h)
		else if(o + abs(h) < (cy<<6)-16) k += Math.sign(h)||Math.sign(1/h)
	}
	if(k >= 5){ chunk.fill(Blocks.air); return }
	if(k <= -5){ chunk.fill(fill); return }
	const lvl = typeof level == 'function' ? level(cx, cy) : level-cy
	for(let i = 0; i < 4160;){
		if(i < 64){
			if(flags&1){
				heights[i] = Infinity
				facs[i] = 0
			}else{
				const lerp = lerpLookup[i & 15]
				const offset = (1 - lerp) * biomeData[i>>4] + lerp * biomeData[(i>>4)+1]
				const height = (1 - lerp) * biomeData[(i>>4)+5] + lerp * biomeData[(i>>4)+6]
				facs[i] = ((cy << 6) - offset) / height
				heights[i] = height
			}
		}
		const height = heights[i & 63]
		const fac = facs[i & 63]
		const {deepsurface, surface} = biomes[(i >> 4 & 3) + (i >> 3 & 1)]
		const u = sel[i] = (sel[i] >= 1 ? high[i] : sel[i] <= 0 ? low[i] : sel[i] * high[i] + (1-sel[i]) * low[i]) + fac + (i >> 6) / height
		if(i < 64){i++;continue}
		const s = sel[i -= 64]
		chunk[i] = s < 0 ?
			u >= 0 && surface ?
				surface
			: s > -5/height && deepsurface ?
				deepsurface
			: fill
		: lvl>0 ? lvl==1 && i >= 4032 ? liquidSurface : liquid : Blocks.air
		i += 65
	}
}

function fill(cx, cy){
	let g = L[0] = imxs32_2(cx, cy); makeVector(0, g)
	for(let i = 1; i < 16; i++) makeVector(i, L[i]=g=imxs32(g,-150702732))
	for(let j = 0; j < 16; j++){
		g = L[j]
		for(let i = 17; i < 289; i+=17) makeVector(i+j, g=imxs32(g,1975484815))
	}
	makeVector(272, g = imxs32_2(cx, cy + 1))
	for(let i = 273; i < 288; i++) makeVector(i, g=imxs32(g,-150702732))
	makeVector(16, g = imxs32_2(cx + 1, cy))
	for(let i = 33; i < 288; i+=17) makeVector(i, g=imxs32(g,1975484815))
	makeVector(288, g = imxs32_2(cx + 1, cy + 1))
}
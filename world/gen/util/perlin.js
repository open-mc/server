import { biomesFor, biomesheet } from './biomes.js'
import { imxs32_2 } from './random.js'

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
export function fill(cx, cy){
	const biomes = biomesFor(cx)
	const g = imxs32_2(cx, cy)
	makeVector(0, g)
	const g_up = imxs32_2(cx, cy + 1)
	makeVector(272, g_up)
	const g_right = imxs32_2(cx + 1, cy)
	makeVector(16, g_right)
	const g_upright = imxs32_2(cx + 1, cy + 1)
	makeVector(288, g_upright)
	for(let i = 0, x = .0078125, y = 0; i < 4160; i++,x+=.015625){if(x>=1)x=.0078125,y+=.015625
		const nx = x - 1
		const ny = y - 1
		low[i] = (((x * xlow[0] + y * ylow[0]) * nx * nx + (nx * xlow[16] + y * ylow[16]) * x * x) * ny * ny
		  + ((x * xlow[272] + ny * ylow[272]) * nx * nx + (nx * xlow[288] + ny * ylow[288]) * x * x) * y * y) * 4
		high[i] = (((x * xhigh[0] + y * yhigh[0]) * nx * nx + (nx * xhigh[16] + y * yhigh[16]) * x * x) * ny * ny
		  + ((x * xhigh[272] + ny * yhigh[272]) * nx * nx + (nx * xhigh[288] + ny * yhigh[288]) * x * x) * y * y) * 4
		sel[i] = (((x * xsel[0] + y * ysel[0]) * nx * nx + (nx * xsel[16] + y * ysel[16]) * x * x) * ny * ny
		  + ((x * xsel[272] + ny * ysel[272]) * nx * nx + (nx * xsel[288] + ny * ysel[288]) * x * x) * y * y) * 4 + 0.5
	}
	
	for(let i = 0; i < 4160;){
		if(i < 64){
			let {offset, height} = biomes[i >> 4 & 3]
			const {offset: o2, height: h2} = biomes[(i >> 4 & 3) + 1]
			const lerp = lerpLookup[i & 15]
			offset = (1 - lerp) * offset + lerp * o2
			height = (1 - lerp) * height + lerp * h2
			facs[i] = ((cy << 6) - offset) / height
			heights[i] = height
		}
		const height = heights[i & 63]
		const fac = facs[i & 63]
		const {deepsurface, surface} = biomes[(i >> 4 & 3) + (i >> 3 & 1)]
		const u = sel[i] = (sel[i] * low[i] + (1-sel[i]) * high[i]) + fac + (i >> 6) / height
		if(i < 64){i++;continue}
		const s = sel[i -= 64]
		chunk[i] = s < 0 ?
			u >= 0 && surface ?
				surface
			: s > -5/height && deepsurface ?
				deepsurface
			: Blocks.stone()
		: cy < 0 ? Blocks.water() : Blocks.air()
		i += 65
	}
}
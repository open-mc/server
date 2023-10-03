import { filler } from '../util/perlin.js'
import { imxs32_2 } from '../util/random.js'
import { Blocks, air, chunk } from '../vars.js'

const generation = (filler) => (cx, cy) => {
	filler(cx,cy)
	const qx = (cx-4)&0xfffffff8, qy = (cy-4)&0xfffffff8
	// x,y,x,y,x,y,x,y
	const nearestIslands = [0,0,0,0,0,0,0,0]
	let seed = imxs32_2(qx, qy, 1377476048, 676295573)
	nearestIslands[0] = seed<<1&0x1fe
	nearestIslands[1] = seed>>7&0x1fe
	seed = imxs32_2(qx+1, qy, 1377476048, 676295573)
	nearestIslands[2] = seed<<1&0x1fe
	nearestIslands[3] = seed>>7&0x1fe
	seed = imxs32_2(qx, qy+1, 1377476048, 676295573)
	nearestIslands[4] = seed<<1&0x1fe
	nearestIslands[5] = seed>>7&0x1fe
	seed = imxs32_2(qx+1, qy+1, 1377476048, 676295573)
	nearestIslands[6] = seed<<1&0x1fe
	nearestIslands[7] = seed>>7&0x1fe


}

export const superflat = air

export const fill = generation(() => void(chunk.fill(Blocks.endstone)))
export const flat = generation(superflat)
const endPerlin = new Array(5).fill({ surface: null, offset: 0, height: 64, deepsurface: null })
export const perlin = generation(filler(Blocks.endstone, Blocks.air, -33554432, () => endPerlin, 1))

const end = [null,null,null,null,null]
for(let i = 0; i < 5; i++) end[i] = { surface: null, offset: 0, height: 64, deepsurface: null }
const defaultFiller = filler(Blocks.endstone, Blocks.air, -33554432, (cx, cy) => {
	if(cy >= 0){
		for(let i = 0; i < 5; i++){
			end[i].offset = (1.5-abs(cx+i/4))*8
			end[i].height = 2
		}
	}else{
		for(let i = 0; i < 5; i++){
			end[i].offset = (1.5-abs(cx+i/4))*-32
			end[i].height = -16
		}
	}
	return end
})
export default generation(function(cx,cy){
	if(cy > 1 || cy < -2){
		air()
		return
	}
	defaultFiller(cx,cy)
}, 3, -2)
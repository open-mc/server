import { filler } from '../util/perlin.js'
import { Blocks, air, chunk } from '../vars.js'

const generation = (filler) => (cx, cy) => {
	filler(cx,cy)
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
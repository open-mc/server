import { imxs32 } from './util/random.js'
import { Blocks, chunk } from './vars.js'

const blob = [0,1,-1,64,-64,65,-65,63,-63], ur = [63,64,65,1,-63], ul = [65,64,63,-1,-65], dr = [-65,-64,-63,1,65], dl = [-63,-64,-65,-1,63]
function fillIf(r, arr, con, b){
	for(const o of arr)if(chunk[r+o & 4095] == con)chunk[r+o & 4095] = b
}
export function veins(rand, ore, tries = 4, size = 8, replace = Blocks.stone){
	//Ore generation
	for(let i = 0; i < tries; i++){
		let r = rand & 4095
		fillIf(r, blob, replace, ore)
		for(let j=10+(size<<1); j>10; j-=2){
			switch(rand>>j & 3){
				case 0: r += 65; fillIf(r, ur, replace, ore); break
				case 1: r += 63; fillIf(r, ul, replace, ore); break
				case 2: r -= 63; fillIf(r, dr, replace, ore); break
				case 3: r -= 65; fillIf(r, dl, replace, ore); break
			}
		}
		rand = imxs32(rand, 220751007)
	}
	return rand
}
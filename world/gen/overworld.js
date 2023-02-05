import { biomesheet } from './util/biomes.js'
import { fill } from './util/perlin.js'
import { Blocks, chunk } from './vars.js'

export const flat = function(cx, cy){
	const filler = cy > -1 ? Blocks.air : Blocks.stone
	chunk.fill(filler)
	if(cy == -1) for(let i = 3712; i < 4096; i++)chunk[i] = i >= 4032 ? Blocks.grass : Blocks.dirt
}
export default function(cx, cy){
	if(cy > 3){
		chunk.fill(Blocks.air)
		return
	}
	if(cy < -2){
		chunk.fill(Blocks.stone)
		if(cy == -33554432){
			for(let y = 5; y >= 0; y--){
				for(let x = 0; x < 64; x++){
					if(Math.random() * 6 > y)chunk[x + y * 64] = Blocks.bedrock
				}
			}
		}
	}else{
		//PERLIN
		fill(cx, cy)
	}
}
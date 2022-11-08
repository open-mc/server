import { biomes } from './util/biomes.js'
import { fill } from './util/perlin.js'

export const flat = function(cx, cy){
	const filler = cy > -1 ? Blocks.air() : Blocks.stone()
	chunk.fill(filler)
	if(cy == -1) for(let i = 3712; i < 4096; i++)chunk[i] = i >= 4032 ? Blocks.grass() : Blocks.dirt()
}
export default function(cx, cy){
	const biome = biomes(cx)
	if(cy > 3){
		chunk.fill(Blocks.air())
		return
	}if(cy < -2){
		chunk.fill(Blocks.stone())
	}else{
		//PERLIN
		fill(cx, cy, biome)
	}
}
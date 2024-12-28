import { Biome, Blocks, Biomes } from "../globals.js"
import { down, getX, peekNoise, place, placeat } from "../util/chunk.js"
import { LowNoise1D, Rng1D } from "../util/random.js"

export const depthNoise = LowNoise1D('depth'), foliageRng = Rng1D('tall_grass')

Biomes.overworld = new Biome()

export const overworld = Biomes.overworld.add({
	airBlock: Blocks.air,
	surface(){
		if(!(foliageRng(getX())&7)){
			placeat(0, 1, Blocks.tall_grass)
		}
		place(Blocks.grass)
		let d = round(depthNoise(getX())*2+5)
		while(--d){
			down()
			if(!peekNoise()) break
			place(Blocks.dirt)
		}
	},
})
import { Biomes, Blocks } from '../globals.js'
import { down, getX, load, peekNoise, peekNoiseLeft, peekNoiseRight, place, placeup, save, up } from '../util/chunk.js'
import { overworld, depthNoise, foliageRng } from './overworld.js'

Biomes.snowy = overworld.add({
	temperature: 0.2,
	humidity: 0.8,
	surface(){
		//place(Blocks.snow)
		down()
		place(Blocks.snowy_grass)
		let d = round(depthNoise(getX())*2+5)
		while(--d){
			down()
			if(!peekNoise()) break
			place(Blocks.dirt)
		}
	},
})
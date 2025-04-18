import { Biomes, Blocks } from '../globals.js'
import { down, getX, getY, peekAirType, peekNoise, place } from '../util/chunk.js'
import { depthNoise } from './overworld.js'

Biomes.ocean = Biomes.overworld.add({
	priority: 0,
	surface(){
		down()
		const block = getY() < -32 ? Blocks.gravel : Blocks.sand
		place(block)
		let d = round(depthNoise(getX())*2+5)
		while(--d){
			down()
			if(!peekNoise()) break
			place(block)
		}
	}
})
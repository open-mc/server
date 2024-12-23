import { Biomes, Blocks } from '../globals.js'
import { down, getX, peekNoise, place } from '../util/chunk.js'
import { overworld, depthNoise, foliageRng } from './overworld.js'

Biomes.desert = overworld.add({
	temperature: 0.8,
	humidity: 0.2,
	surface(){
		place(Blocks.sand)
		let d = round(depthNoise(getX())*2+5)
		while(--d){
			down()
			if(!peekNoise()) return
			place(Blocks.sand)
		}
		d = (foliageRng(getX())&3)+3
		while(--d){
			down()
			if(!peekNoise()) return
			place(Blocks.sandstone)
		}
	},
})
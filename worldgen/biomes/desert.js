import { Biomes, Blocks } from '../globals.js'
import { down, getX, load, peekNoise, peekNoiseLeft, peekNoiseRight, place, placeup, save, up } from '../util/chunk.js'
import { overworld, depthNoise, foliageRng } from './overworld.js'

Biomes.desert = overworld.add({
	temperature: 0.8,
	humidity: 0.2,
	surface(){
		const f = foliageRng(getX()); let f1 = f>>2&63
		a: if(f1<3){
			const a = save()
			up()
			if(peekNoiseRight() || peekNoiseLeft()) break a
			do place(Blocks.cactus), up(); while(f1--)
			load(a)
		}else if(f1==3) placeup(Blocks.dead_bush)
		place(Blocks.sand)
		let d = round(depthNoise(getX())*2+5)
		while(--d){
			down()
			if(!peekNoise()) return
			place(Blocks.sand)
		}
		d = (f&3)+3
		while(--d){
			down()
			if(!peekNoise()) return
			place(Blocks.sandstone)
		}
	},
})
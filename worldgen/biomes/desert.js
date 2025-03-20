import { Biomes, Blocks } from '../globals.js'
import { down, getX, load, peekNoise, place, placeup, save, up } from '../util/chunk.js'
import { overworld, depthNoise, foliageRng } from './overworld.js'

Biomes.desert = overworld.add({
	temperature: 0.8,
	humidity: 0.2,
	surface(){
		const f = foliageRng(getX()); let f1 = f>>2&63
		a: if(f1<3){
			const a = save()
			if(peekNoise(1,0) || peekNoise(-1,0)) break a
			do place(Blocks.cactus), up(); while(f1--)
			load(a)
		}else if(f1==3) place(Blocks.dead_bush)
		down()
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
	features: []
})
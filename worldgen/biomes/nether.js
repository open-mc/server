import { cmpxchg, getX, place, up } from '../util/chunk.js'
import { Biome, Biomes, Blocks } from '../globals.js'
import { foliageRng } from './overworld.js'

Biomes.nether = new Biome({
	surface(){
		if(foliageRng(getX())&15) return
		up(); cmpxchg(Blocks.air, Blocks.fire)
	}
})
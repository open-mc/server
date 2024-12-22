import { place } from '../util/chunk.js'
import { Biomes, Blocks } from '../globals.js'

Biomes.plains = {
	surface(){
		place(Blocks.grass)
	},
}
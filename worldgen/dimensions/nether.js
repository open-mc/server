import { veins } from '../ores.js'
import { constantBiome } from '../util/biomes.js'
import { filler } from '../util/perlin.js'
import { imxs32_2 } from '../util/random.js'
import { Biomes, Blocks, air } from '../vars.js'

const generation = (filler) => (cx, cy) => {
	filler(cx, cy)
	let rand = imxs32_2(cx, cy, -1377466049, -676095574)
	rand = veins(rand, Blocks.quartz_ore, 3, 5, Blocks.netherrack)
}
export default generation(filler(Blocks.netherrack, Blocks.lava, Blocks.lavaTop, (_, cy) => 6-(cy+16&31), Biomes.nether))

export const opensky = generation(filler(Blocks.netherrack, Blocks.lava, Blocks.lavaTop, -10, Biomes.netheropensky))

export function superflat(_,cy){
	if(cy>=-2&&cy<2) air()
	else chunk.fill(Blocks.netherrack)
}

export const fill = generation(() => void(chunk.fill(Blocks.netherrack)))
export const flat = generation(superflat)
export const perlin = generation(filler(Blocks.netherrack, Blocks.lava, Blocks.lavaTop, -10, Biomes.nether, 1))
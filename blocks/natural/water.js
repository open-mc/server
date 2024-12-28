import { damageTypes } from '../../entities/deathmessages.js'
import { antChunk, blockevent, place } from '../../misc/ant.js'
import { Dimensions } from '../../world/index.js'
import { Block, BlockFlags, Blocks } from '../block.js'
import { fluidify } from '../fluid.js'

class Water extends Block{
	static flags = BlockFlags.REPLACEABLE | BlockFlags.CLIMBABLE
	static viscosity = 0.15
	static delay = 5
	static blast = 400
	static combine(fluid){
		if(fluid.fluidType == 'lava')
			blockevent(32), place(fluid.source ? Blocks.obsidian : Blocks.cobblestone)
	}
}
void({
	filled: Blocks.water,
	top: Blocks.waterTop,
	flowing: Blocks.waterFlowing,
	levels: [, Blocks.waterFlowing1, Blocks.waterFlowing2, Blocks.waterFlowing3, Blocks.waterFlowing4, Blocks.waterFlowing5, Blocks.waterFlowing6, Blocks.waterFlowing7]
} = fluidify(Water, 'water', true))

class Lava extends Water{
	static viscosity = 0.5
	static get delay(){return antChunk.world == Dimensions.nether ? 5 : 20}
	static combine(fluid){
		if(fluid.fluidType == 'water')
			blockevent(32), place(fluid.source ? Blocks.stone : Blocks.cobblestone)
	}
	touched(e){
		e.damage?.(4, damageTypes.fire)
	}
}
void({
	filled: Blocks.lava,
	top: Blocks.lavaTop,
	flowing: Blocks.lavaFlowing,
	levels: [, Blocks.lavaFlowing1, Blocks.lavaFlowing2, Blocks.lavaFlowing3, Blocks.lavaFlowing4, Blocks.lavaFlowing5, Blocks.lavaFlowing6, Blocks.lavaFlowing7]
} = fluidify(Lava, 'lava'))
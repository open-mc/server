import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'
import { BlockShape, blockShaped } from '../blockshapes.js'

//Template for defining a bunch of blocks
export class Planks extends Block{
	static flammability = 5
	static tool = 'axe'
	static breaktime = 3
}

//the actual blocks
Blocks.oak_planks = class extends Planks{
	drops(){ return new Items.oak_planks() }
}
Blocks.birch_planks = class extends Planks{
	drops(){ return new Items.oak_planks() }
}
Blocks.spruce_planks = class extends Planks{
	drops(){ return new Items.oak_planks() }
}
Blocks.dark_oak_planks = class extends Planks{
	drops(){ return new Items.oak_planks() }
}
Blocks.acacia_planks = class extends Planks{
	drops(){ return new Items.oak_planks() }
}
Blocks.jungle_planks = class extends Planks{
	drops(){ return new Items.oak_planks() }
}
Blocks.oak_planks_slab = blockShaped(Blocks.oak_planks, BlockShape.SLAB)
Blocks.oak_planks_upper_slab = blockShaped(Blocks.oak_planks, BlockShape.UPPER_SLAB)

Blocks.birch_planks_slab = blockShaped(Blocks.birch_planks, BlockShape.SLAB)
Blocks.birch_planks_upper_slab = blockShaped(Blocks.birch_planks, BlockShape.UPPER_SLAB)

Blocks.spruce_planks_slab = blockShaped(Blocks.spruce_planks, BlockShape.SLAB)
Blocks.spruce_planks_upper_slab = blockShaped(Blocks.spruce_planks, BlockShape.UPPER_SLAB)

Blocks.dark_oak_planks_slab = blockShaped(Blocks.dark_oak_planks, BlockShape.SLAB)
Blocks.dark_oak_planks_upper_slab = blockShaped(Blocks.dark_oak_planks, BlockShape.UPPER_SLAB)

Blocks.acacia_planks_slab = blockShaped(Blocks.acacia_planks, BlockShape.SLAB)
Blocks.acacia_planks_upper_slab = blockShaped(Blocks.acacia_planks, BlockShape.UPPER_SLAB)

Blocks.jungle_planks_slab = blockShaped(Blocks.jungle_planks, BlockShape.SLAB)
Blocks.jungle_planks_upper_slab = blockShaped(Blocks.jungle_planks, BlockShape.UPPER_SLAB)
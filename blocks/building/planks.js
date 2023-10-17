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
Blocks.oak_planks_slab = blockShaped(Blocks.oak_planks, BlockShape.SLAB, Items.oak_planks_slab)
Blocks.oak_planks_upper_slab = blockShaped(Blocks.oak_planks, BlockShape.UPPER_SLAB, Items.oak_planks_slab)

Blocks.birch_planks_slab = blockShaped(Blocks.birch_planks, BlockShape.SLAB, Items.birch_planks_slab)
Blocks.birch_planks_upper_slab = blockShaped(Blocks.birch_planks, BlockShape.UPPER_SLAB, Items.birch_planks_slab)

Blocks.spruce_planks_slab = blockShaped(Blocks.spruce_planks, BlockShape.SLAB, Items.spruce_planks_slab)
Blocks.spruce_planks_upper_slab = blockShaped(Blocks.spruce_planks, BlockShape.UPPER_SLAB, Items.spruce_planks_slab)

Blocks.dark_oak_planks_slab = blockShaped(Blocks.dark_oak_planks, BlockShape.SLAB, Items.dark_oak_planks_slab)
Blocks.dark_oak_planks_upper_slab = blockShaped(Blocks.dark_oak_planks, BlockShape.UPPER_SLAB, Items.dark_oak_planks_slab)

Blocks.acacia_planks_slab = blockShaped(Blocks.acacia_planks, BlockShape.SLAB, Items.acacia_planks_slab)
Blocks.acacia_planks_upper_slab = blockShaped(Blocks.acacia_planks, BlockShape.UPPER_SLAB, Items.acacia_planks_slab)

Blocks.jungle_planks_slab = blockShaped(Blocks.jungle_planks, BlockShape.SLAB, Items.jungle_planks_slab)
Blocks.jungle_planks_upper_slab = blockShaped(Blocks.jungle_planks, BlockShape.UPPER_SLAB, Items.jungle_planks_slab)
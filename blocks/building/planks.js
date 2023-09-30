import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'
import { BlockShape } from '../blockshapes.js'

//Template for defining a bunch of blocks
class Planks extends Block{
	static flammability = 5
	static tool = 'axe'
	static breaktime = 3
}

//the actual blocks
Blocks.oak_planks = class extends Planks{
	drops(){ return Items.oak_planks() }
}
Blocks.birch_planks = class extends Planks{
	drops(){ return Items.oak_planks() }
}
Blocks.spruce_planks = class extends Planks{
	drops(){ return Items.oak_planks() }
}
Blocks.dark_oak_planks = class extends Planks{
	drops(){ return Items.oak_planks() }
}
Blocks.acacia_planks = class extends Planks{
	drops(){ return Items.oak_planks() }
}
Blocks.jungle_planks = class extends Planks{
	drops(){ return Items.oak_planks() }
}
Blocks.oak_planks_slab = class extends Blocks.oak_planks{
	static blockShape = BlockShape.SLAB
	drops(){ return Items.oak_planks_slab() }
}
Blocks.oak_planks_upper_slab = class extends Blocks.oak_planks_slab{ static blockShape = BlockShape.UPPER_SLAB }

Blocks.birch_planks_slab = class extends Blocks.birch_planks{
	static blockShape = BlockShape.SLAB
	drops(){ return Items.birch_planks_slab() }
}
Blocks.birch_planks_upper_slab = class extends Blocks.birch_planks_slab{ static blockShape = BlockShape.UPPER_SLAB }

Blocks.spruce_planks_slab = class extends Blocks.spruce_planks{
	static blockShape = BlockShape.SLAB
	drops(){ return Items.spruce_planks_slab() }
}
Blocks.spruce_planks_upper_slab = class extends Blocks.spruce_planks_slab{ static blockShape = BlockShape.UPPER_SLAB }

Blocks.dark_oak_planks_slab = class extends Blocks.dark_oak_planks{
	static blockShape = BlockShape.SLAB
	drops(){ return Items.dark_oak_planks_slab() }
}
Blocks.dark_oak_planks_upper_slab = class extends Blocks.dark_oak_planks_slab{ static blockShape = BlockShape.UPPER_SLAB }

Blocks.acacia_planks_slab = class extends Blocks.acacia_planks{
	static blockShape = BlockShape.SLAB
	drops(){ return Items.acacia_planks_slab() }
}
Blocks.acacia_planks_upper_slab = class extends Blocks.acacia_planks_slab{ static blockShape = BlockShape.UPPER_SLAB }

Blocks.jungle_planks_slab = class extends Blocks.jungle_planks{
	static blockShape = BlockShape.SLAB
	drops(){ return Items.jungle_planks_slab() }
}
Blocks.jungle_planks_upper_slab = class extends Blocks.jungle_planks_slab{ static blockShape = BlockShape.UPPER_SLAB }
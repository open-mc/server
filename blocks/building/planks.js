import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'
import { slabify, upperslabify } from '../blockshapes.js'

//Template for defining a bunch of blocks
class Planks extends Block{
	static flammability = 5
	static tool = 'axe'
	static breaktime = 3
}

//the actual blocks
Blocks.oak_planks = class extends Planks{
	drops(){ return Items.oak_planks }
}
Blocks.birch_planks = class extends Planks{
	drops(){ return Items.oak_planks }
}
Blocks.spruce_planks = class extends Planks{
	drops(){ return Items.oak_planks }
}
Blocks.dark_oak_planks = class extends Planks{
	drops(){ return Items.oak_planks }
}
Blocks.acacia_planks = class extends Planks{
	drops(){ return Items.oak_planks }
}
Blocks.jungle_planks = class extends Planks{
	drops(){ return Items.oak_planks }
}
Blocks.oak_planks_slab = slabify(Blocks.oak_planks)
Blocks.oak_planks_upper_slab = upperslabify(Blocks.oak_planks)

Blocks.birch_planks_slab = slabify(Blocks.birch_planks)
Blocks.birch_planks_upper_slab = upperslabify(Blocks.birch_planks)

Blocks.spruce_planks_slab = slabify(Blocks.spruce_planks)
Blocks.spruce_planks_upper_slab = upperslabify(Blocks.spruce_planks)

Blocks.dark_oak_planks_slab = slabify(Blocks.dark_oak_planks)
Blocks.dark_oak_planks_upper_slab = upperslabify(Blocks.dark_oak_planks)

Blocks.acacia_planks_slab = slabify(Blocks.acacia_planks)
Blocks.acacia_planks_upper_slab = upperslabify(Blocks.acacia_planks)

Blocks.jungle_planks_slab = slabify(Blocks.jungle_planks)
Blocks.jungle_planks_upper_slab = upperslabify(Blocks.jungle_planks)
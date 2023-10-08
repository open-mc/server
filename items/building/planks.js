import { Blocks } from '../../blocks/block.js'
import { slabifyItem } from '../../blocks/blockshapes.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'
import '../../blocks/building/planks.js'

//Template for defining a bunch of blocks
class Planks extends Item{
}

//the actual blocks
Items.oak_planks = class extends Planks{
	place(){ place(Blocks.oak_planks); super.use() }
}
Items.birch_planks = class extends Planks{
	place(){ place(Blocks.birch_planks); super.use() }
}
Items.spruce_planks = class extends Planks{
	place(){ place(Blocks.spruce_planks); super.use() }
}
Items.dark_oak_planks = class extends Planks{
	place(){ place(Blocks.dark_oak_planks); super.use() }
}
Items.acacia_planks = class extends Planks{
	place(){ place(Blocks.acacia_planks); super.use() }
}
Items.jungle_planks = class extends Planks{
	place(){ place(Blocks.jungle_planks); super.use() }
}

Items.oak_planks_slab = slabifyItem(Items.oak_planks, Blocks.oak_planks)
Items.birch_planks_slab = slabifyItem(Items.birch_planks, Blocks.birch_planks)
Items.spruce_planks_slab = slabifyItem(Items.spruce_planks, Blocks.spruce_planks)
Items.dark_oak_planks_slab = slabifyItem(Items.dark_oak_planks, Blocks.dark_oak_planks)
Items.acacia_planks_slab = slabifyItem(Items.acacia_planks, Blocks.acacia_planks)
Items.jungle_planks_slab = slabifyItem(Items.jungle_planks, Blocks.jungle_planks)
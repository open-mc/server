import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

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

Items.oak_planks_slab = class extends Items.oak_planks{
	place(_, fy){ place(fy >= 0.5 ? Blocks.oak_planks_upper_slab : Blocks.oak_planks_slab); super.use() }
}
Items.birch_planks_slab = class extends Items.birch_planks{
	place(_, fy){ place(fy >= 0.5 ? Blocks.birch_planks_upper_slab : Blocks.birch_planks_slab); super.use() }
}

Items.spruce_planks_slab = class extends Items.spruce_planks{
	place(_, fy){ place(fy >= 0.5 ? Blocks.spruce_planks_upper_slab : Blocks.spruce_planks_slab); super.use() }
}

Items.dark_oak_planks_slab = class extends Items.dark_oak_planks{
	place(_, fy){ place(fy >= 0.5 ? Blocks.dark_oak_planks_upper_slab : Blocks.dark_oak_planks_slab); super.use() }
}

Items.acacia_planks_slab = class extends Items.acacia_planks{
	place(_, fy){ place(fy >= 0.5 ? Blocks.acacia_planks_upper_slab : Blocks.acacia_planks_slab); super.use() }
}

Items.jungle_planks_slab = class extends Items.jungle_planks{
	place(_, fy){ place(fy >= 0.5 ? Blocks.jungle_planks_upper_slab : Blocks.jungle_planks_slab); super.use() }
}
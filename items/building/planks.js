import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

//Template for defining a bunch of blocks
class Planks extends Item{
}

//the actual blocks
Items.oak_planks = class extends Planks{
	place(){ place(Blocks.oak_planks); super.use(true) }
}
Items.birch_planks = class extends Planks{
	place(){ place(Blocks.oak_planks); super.use(true) }
}
Items.spruce_planks = class extends Planks{
	place(){ place(Blocks.oak_planks); super.use(true) }
}
Items.dark_oak_planks = class extends Planks{
	place(){ place(Blocks.oak_planks); super.use(true) }
}
Items.acacia_planks = class extends Planks{
	place(){ place(Blocks.oak_planks); super.use(true) }
}
Items.jungle_planks = class extends Planks{
	place(){ place(Blocks.oak_planks); super.use(true) }
}
Items.oak_planks_slab = class extends Items.oak_planks{
	place(){ place(Blocks.oak_planks_slab); super.use(true) }
}

Items.birch_planks_slab = class extends Items.birch_planks{
	place(){ place(Blocks.birch_planks_slab); super.use(true) }
}

Items.spruce_planks_slab = class extends Items.spruce_planks{
	place(){ place(Blocks.spruce_planks_slab); super.use(true) }
}

Items.dark_oak_planks_slab = class extends Items.dark_oak_planks{
	place(){ place(Blocks.dark_oak_planks_slab); super.use(true) }
}

Items.acacia_planks_slab = class extends Items.acacia_planks{
	place(){ place(Blocks.acacia_planks_slab); super.use(true) }
}

Items.jungle_planks_slab = class extends Items.jungle_planks{
	place(){ place(Blocks.jungle_planks_slab); super.use(true) }
}
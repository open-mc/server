import { Blocks } from '../../blocks/block.js'
import { peekdown, place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.oak_sapling = class extends Item{
	place(fx, fy, p){ if(!peekdown().dirt) return; place(Blocks.oak_sapling); super.use(1, p) }
}

Items.birch_sapling = class extends Item{
	place(fx, fy, p){ if(!peekdown().dirt) return; place(Blocks.birch_sapling); super.use(1, p) }
}

Items.spruce_sapling = class extends Item{
	place(fx, fy, p){ if(!peekdown().dirt) return; place(Blocks.spruce_sapling); super.use(1, p) }
}

Items.dark_oak_sapling = class extends Item{
	place(fx, fy, p){ if(!peekdown().dirt) return; place(Blocks.dark_oak_sapling); super.use(1, p) }
}

Items.acacia_sapling = class extends Item{
	place(fx, fy, p){ if(!peekdown().dirt) return; place(Blocks.acacia_sapling); super.use(1, p) }
}

Items.jungle_sapling = class extends Item{
	place(fx, fy, p){ if(!peekdown().dirt) return; place(Blocks.jungle_sapling); super.use(1, p) }
}
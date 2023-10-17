import { Blocks } from '../../blocks/block.js'
import { peekdown, place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.oak_sapling = class extends Item{
	place(){ if(!peekdown().dirt) return; place(Blocks.oak_sapling); super.use(1) }
}

Items.birch_sapling = class extends Item{
	place(){ if(!peekdown().dirt) return; place(Blocks.birch_sapling); super.use(1) }
}

Items.spruce_sapling = class extends Item{
	place(){ if(!peekdown().dirt) return; place(Blocks.spruce_sapling); super.use(1) }
}

Items.dark_oak_sapling = class extends Item{
	place(){ if(!peekdown().dirt) return; place(Blocks.dark_oak_sapling); super.use(1) }
}

Items.acacia_sapling = class extends Item{
	place(){ if(!peekdown().dirt) return; place(Blocks.acacia_sapling); super.use(1) }
}

Items.jungle_sapling = class extends Item{
	place(){ if(!peekdown().dirt) return; place(Blocks.jungle_sapling); super.use(1) }
}
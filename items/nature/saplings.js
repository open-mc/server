import { Blocks } from '../../blocks/block.js'
import { peekdown, placeblock } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.oak_sapling = class extends Item{
	place(){ if(!peekdown().dirt) return; placeblock(Blocks.oak_sapling); return 1 }
}

Items.birch_sapling = class extends Item{
	place(){ if(!peekdown().dirt) return; placeblock(Blocks.birch_sapling); return 1 }
}

Items.spruce_sapling = class extends Item{
	place(){ if(!peekdown().dirt) return; placeblock(Blocks.spruce_sapling); return 1 }
}

Items.dark_oak_sapling = class extends Item{
	place(){ if(!peekdown().dirt) return; placeblock(Blocks.dark_oak_sapling); return 1 }
}

Items.acacia_sapling = class extends Item{
	place(){ if(!peekdown().dirt) return; placeblock(Blocks.acacia_sapling); return 1 }
}

Items.jungle_sapling = class extends Item{
	place(){ if(!peekdown().dirt) return; placeblock(Blocks.jungle_sapling); return 1 }
}
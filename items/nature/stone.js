import { Blocks } from '../../blocks/block.js'
import { placeblock } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.stone = class extends Item{
	place(){ placeblock(Blocks.stone); return 1 }
}
Items.cobblestone = class extends Item{
	place(){ placeblock(Blocks.cobblestone); return 1 }
}

Items.netherrack = class extends Item{
	place(){ placeblock(Blocks.netherrack); return 1 }
}

Items.obsidian = class extends Item{
	place(){ placeblock(Blocks.obsidian); return 1 }
}
Items.glowing_obsidian = class extends Items.obsidian{
	place(){ placeblock(Blocks.glowing_obsidian); return 1 }
}
Items.bedrock = class extends Item{
	static forbidden = true
	place(){ placeblock(Blocks.bedrock); return 1 }
}


Items.endstone = class extends Item{
	place(){ placeblock(Blocks.endstone); return 1 }
}
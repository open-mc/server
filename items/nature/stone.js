import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.stone = class Stone extends Item{
	place(){ place(Blocks.stone); super.use() }
}

Items.netherrack = class Netherrack extends Item{
	place(){ place(Blocks.netherrack); super.use() }
}

Items.obsidian = class Obsidian extends Item{
	place(){ place(Blocks.obsidian); super.use() }
}
Items.glowing_obsidian = class extends Items.obsidian{
	place(){ place(Blocks.glowing_obsidian); super.use() }
}
Items.bedrock = class Bedrock extends Item{
	place(){ place(Blocks.bedrock); super.use() }
}


Items.endstone = class extends Item{
	place(){ place(Blocks.endstone); super.use() }
}
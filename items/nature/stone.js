import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.stone = class Stone extends Item{
	place(){ place(Blocks.stone); super.use(true) }
}

Items.netherrack = class Netherrack extends Item{
	place(){ place(Blocks.netherrack); super.use(true) }
}

Items.obsidian = class Obsidian extends Item{
	place(){ place(Blocks.obsidian); super.use(true) }
}
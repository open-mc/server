import { Blocks } from '../../blocks/block.js'
import { Item, Items } from '../item.js'

Items.stone = class Stone extends Item{
	interact(){ super.interact(Blocks.stone) }
}

Items.netherrack = class Netherrack extends Item{
	interact(){ super.interact(Blocks.netherrack) }
}

Items.obsidian = class Obsidian extends Item{
	interact(){ super.interact(Blocks.obsidian) }
}
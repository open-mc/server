import { Blocks } from '../../blocks/block.js'
import { Item, Items } from '../item.js'

Items.stone = class Stone extends Item{
	place(){ return Blocks.stone }
}

Items.netherrack = class Netherrack extends Item{
	place(){ return Blocks.netherrack }
}
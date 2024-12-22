import { Blocks } from '../../blocks/block.js'
import { placeblock } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.sand = class extends Item{
	place(){ placeblock(Blocks.sand); return 1 }
}

Items.gravel = class extends Item{
	place(){ placeblock(Blocks.gravel); return 1 }
}
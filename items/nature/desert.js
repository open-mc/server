import { Item, Items } from '../item.js'
import { placeblock, peekdown, solidleft, solidright } from '../../misc/ant.js'
import { Blocks } from '../../blocks/block.js'

Items.cactus = class extends Item{
	place(){
		const d = peekdown()
		if((d == Blocks.sand || d == Blocks.cactus) && !solidleft() && !solidright()) placeblock(Blocks.cactus); return 1 }
}

Items.dead_bush = class extends Item{
	place(){ if(peekdown() == Blocks.sand) placeblock(Blocks.dead_bush); return 1 }
}
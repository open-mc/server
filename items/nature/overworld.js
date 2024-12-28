import { Blocks } from '../../blocks/block.js'
import { peekdown, placeblock } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.grass = class Grass extends Item{
	place(){ placeblock(Blocks.grass); return 1 }
}

Items.tall_grass = class Grass extends Item{
	place(){ if(peekdown() == Blocks.grass) placeblock(Blocks.tall_grass); return 1 }
}

Items.dirt = class Dirt extends Item{
	place(){ placeblock(Blocks.dirt); return 1 }
}
import { Blocks } from '../../blocks/block.js'
import { Entities } from '../../entities/entity.js'
import { peek, placeblock, up, summon } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.tnt = class extends Item{
	place(){ placeblock(Blocks.tnt); return 1 }
}

Items.end_crystal = class extends Item{
	interact(b){
		if(b != Blocks.obsidian && b != Blocks.bedrock) return 0
		up()
		if(peek().constructor != Blocks.air) return 0
		summon(Entities.end_crystal)
		return 1
	}
}
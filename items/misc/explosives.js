import { Blocks } from '../../blocks/block.js'
import { Entities } from '../../entities/entity.js'
import { peek, place, placeblock, up, summon } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.tnt = class extends Item{
	place(){ placeblock(Blocks.tnt); return 1 }
}

Items.end_crystal = class extends Item{
	interact(b){
		const pow = b == Blocks.glowing_obsidian ? 400 : b == Blocks.obsidian || b == Blocks.bedrock ? 180 : 0
		if(!pow) return 0
		if(pow == 400) place(Blocks.obsidian)
		up()
		if(peek().constructor != Blocks.air) return 0
		summon(Entities.end_crystal).power = pow
		return 1
	}
}
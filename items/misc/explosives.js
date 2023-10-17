import { Blocks } from '../../blocks/block.js'
import { Entities } from '../../entities/entity.js'
import { peek, place, up, summon, getY, blockevent } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.tnt = class extends Item{
	place(){ place(Blocks.tnt); super.use(1) }
}

Items.end_crystal = class extends Item{
	interact(b){
		if(b != Blocks.obsidian && b != Blocks.bedrock) return
		up()
		if(peek().constructor != Blocks.air) return
		summon(Entities.end_crystal)
		super.use(1)
	}
}
import { Entities } from '../../entities/entity.js'
import { Items } from '../../items/item.js'
import { soliddown, place, summon } from '../../misc/ant.js'
import { Block, Blocks } from '../block.js'

Blocks.sand = class extends Block{
	static tool = 'shovel'
	static breaktime = 1
	update(){
		if(!soliddown()){
			place(Blocks.air)
			summon(Entities.falling_block).block = this.id
			return
		}
	}
	drops(){ return new Items.sand(1) }
}
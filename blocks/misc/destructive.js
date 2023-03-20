import { Entities } from '../../entities/entity.js'
import { Items } from '../../items/item.js'
import { place, summon } from '../../misc/ant.js'
import { Block, Blocks } from '../block.js'

Blocks.tnt = class extends Block{
	static breaktime = 0
	drops(){ return Items.tnt(2) }
	destroyed(){
		place(Blocks.air)
		const tnt = summon(Entities.tnt)
		tnt.age = 65
		return true
	}
}
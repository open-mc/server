import { Entities } from '../../entities/entity.js'
import { Items } from '../../items/item.js'
import { down, peek, peekdown, place, summon, up } from '../../misc/ant.js'
import { Block, Blocks } from '../block.js'

Blocks.tnt = class extends Block{
	static breaktime = 0
	drops(){ return Items.tnt(4) }
	destroyed(){
		place(Blocks.air)
		const tnt = summon(Entities.tnt)
		tnt.age = floor(random() * 20) + 55
		return true
	}
}

Blocks.fire = class extends Block{
	static solid = false
	set(){
		if(peekdown() == Blocks.obsidian){
			let i = -1
			while(++i < 32 & !(up(), peek().solid));
			if(peek() != Blocks.obsidian) return
			if(i < 3) return
			while(--i>-2) down(), place(Blocks.portal)
		}
	}
}
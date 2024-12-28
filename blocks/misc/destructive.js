import { Entities } from '../../entities/entity.js'
import { damageTypes } from '../../entities/deathmessages.js'
import { Items } from '../../items/item.js'
import { antChunk, chunkTileIndex, down, peek, peekdown, place, summon, up } from '../../misc/ant.js'
import { Block, BlockFlags, Blocks } from '../block.js'

Blocks.tnt = class extends Block{
	static breaktime = 0
	drops(){ return new Items.tnt() }
	destroy(){
		const tnt = summon(Entities.tnt)
		tnt.age = floor(random() * 20) + 55
		return
	}
}

Blocks.fire = class extends Block{
	static flags = BlockFlags.REPLACEABLE | BlockFlags.TARGET_CAPTURE
	static breaktime = 0
	static blast = 10
	update(){
		const b = peekdown()
		if(b == Blocks.obsidian){
			let i = 0
			while(++i < 32 & (up(), peek().replaceable));
			if(peek() != Blocks.obsidian) return
			if(i < 3) return
			while(--i>=0) down(), place(Blocks.portal)
			antChunk.portals.push(chunkTileIndex)
		}else if(b.replaceable){
			place(Blocks.air)
		}
	}
	touched(e){
		e.damage?.(1, damageTypes.fire)
	}
}
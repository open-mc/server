import { Items } from '../../items/item.js'
import { place, peekdown, solidleft, solidright } from '../../misc/ant.js'
import { Block, BlockFlags, Blocks } from '../block.js'

Blocks.cactus = class extends Block{
	static flags = BlockFlags.HARD_TOP | BlockFlags.SOLID_TOP | BlockFlags.TARGETTABLE | BlockFlags.FRAGILE
	static blockShape = [.0625, 0, .9375, 1]
	static breaktime = .5
	update(){
		const d = peekdown()
		if((d != Blocks.sand && d != Blocks.cactus) || solidright() || solidleft()) this.destroy(), place(Blocks.air)
	}
}

Blocks.dead_bush = class extends Block{
	static flags = BlockFlags.TARGETTABLE | BlockFlags.FRAGILE
	static breaktime = 0
	drops(){ return new Items.stick(1+(random()<.5)) }
	update(){
		if(peekdown() != Blocks.sand) this.destroy(), place(Blocks.air)
	}
}
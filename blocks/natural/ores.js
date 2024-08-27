import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

Blocks.coal_ore = class CoalOre extends Block{
	static tool = 'pick'
	static breaktime = 15
	drops(){ return new Items.coal() }
}

Blocks.iron_ore = class IronOre extends Block{
	static tool = 'pick'
	static breaktime = 15
	drops(){ return new Items.iron() }
}

Blocks.quartz_ore = class QuartzOre extends Block{
	static tool = 'pick'
}
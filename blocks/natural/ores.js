import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

Blocks.coal_ore = class extends Block{
	static tool = 'pick'
	static breaktime = 15
	drops(){ return new Items.coal() }
}

Blocks.iron_ore = class extends Block{
	static tool = 'pick'
	static breaktime = 15
	drops(){ return new Items.iron() }
}

Blocks.gold_ore = class extends Block{
	static tool = 'pick'
	static breaktime = 15
	drops(){ return new Items.gold() }
}

Blocks.diamond_ore = class extends Block{
	static tool = 'pick'
	static breaktime = 15
	drops(){ return new Items.diamond() }
}

Blocks.lapis_ore = class extends Block{
	static tool = 'pick'
	static breaktime = 15
	drops(){ return new Items.lapis() }
}

Blocks.quartz_ore = class extends Block{
	static tool = 'pick'
}
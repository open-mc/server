import { explode } from '../../entities/explode.js'
import { Items } from '../../items/item.js'
import { gridevent } from '../../misc/ant.js'
import { Block, Blocks } from '../block.js'

Blocks.stone = class extends Block{
	static breaktime = 7.5
	static blast = 30
	static tool = 'pick'
	drops(item){
		return item && item.tool != 'pick' ? null :
			item?.ench?.has(Enchantments.silk_touch) ? new Items.stone(1) : new Items.cobblestone(1)
	}
}
Blocks.cobblestone = class extends Blocks.stone{
	drops(){ return new Items.cobblestone(1) }
}

Blocks.obsidian = class extends Blocks.stone{
	static breaktime = 250
	static blast = 400
	static tool = 'pick'
	drops(){ return new Items.obsidian(1) }
}

Blocks.glowing_obsidian = class extends Blocks.obsidian{
	static breaktime = 500
	drops(){
		gridevent(3)
		explode(null, 180, true)
		return new Items.glowing_obsidian(1)
	}
}
import { explode } from '../../entities/common/explode.js'
import { Items } from '../../items/item.js'
import { gridevent } from '../../misc/ant.js'
import { Block, Blocks } from '../block.js'

Blocks.stone = class Stone extends Block{
	static breaktime = 7.5
	static blast = 30
	static tool = 'pick'
	drops(){ return Items.stone(1) }
}

Blocks.obsidian = class Obsidian extends Blocks.stone{
	static breaktime = 250
	static blast = 400
	static tool = 'pick'
	drops(){ return Items.obsidian(1) }
}

Blocks.glowing_obsidian = class extends Blocks.obsidian{
	static breaktime = 500
	drops(){
		gridevent(3)
		explode(null, 200, true)
		return Items.glowing_obsidian(1)
	}
}
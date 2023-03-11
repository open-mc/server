import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

Blocks.stone = class Stone extends Block{
	static breaktime = 7.5
	static tool = 'pick'
	drops(i){ return Items.stone(1) }
}

Blocks.obsidian = class Obsidian extends Blocks.stone{
	static breaktime = 250
	static tool = 'pick'
	drops(i){ return Items.obsidian(1) }
}
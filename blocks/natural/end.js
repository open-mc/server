import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

Blocks.endstone = class extends Block{
	static breaktime = 15
	drops(){ return new Items.endstone(1) }
	static tool = 'pick'
}
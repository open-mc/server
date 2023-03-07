import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

Blocks.tnt = class extends Block{
	static breaktime = 0
	drops(){ return Items.tnt(2) }
}
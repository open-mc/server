import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

Blocks.netherrack = class Netherrack extends Block{
	static breaktime = 2
	drops(){ return new Items.netherrack() }
	static tool = 'pick'
}
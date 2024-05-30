import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

Blocks.glass = class extends Block{
	static breaktime = 0.6
	drops(){ return new Items.glass() }
}

Blocks.glowstone = class extends Blocks.glass{
	static breaktime = 0.45
	drops(){ return new Items.glowstone() }
}
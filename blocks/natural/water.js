import { Block, Blocks } from '../block.js'

Blocks.water = class Water extends Block{
	static solid = false
	static replacable = true
}

Blocks.lava = class extends Blocks.water{
	
}
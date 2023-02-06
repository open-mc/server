import { Block, Blocks } from '../block.js'

Blocks.water = class Water extends Block{
	static solid = false
}

Blocks.lava = class extends Blocks.water{
	
}
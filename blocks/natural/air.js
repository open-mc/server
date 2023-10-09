import { Block, Blocks } from '../block.js'

Blocks.air = class Air extends Block{
	static solid = false
	static replacable = true
	static blast = 10
}
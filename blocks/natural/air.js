import { Block, Blocks } from '../block.js'

Blocks.air = class Air extends Block{
	static solid = false
	static blast = 10
}
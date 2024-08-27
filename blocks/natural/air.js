import { Block, Blocks } from '../block.js'

Blocks.air = class Air extends Block{
	static solid = false
	static replaceable = true
	static blast = 10
	static destroy = undefined
}
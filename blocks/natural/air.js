import { Block, BlockFlags, Blocks } from '../block.js'

Blocks.air = class Air extends Block{
	static flags = BlockFlags.REPLACEABLE
	static blast = 10
	static destroy = undefined
}
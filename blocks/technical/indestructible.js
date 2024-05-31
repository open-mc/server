import { Block, Blocks } from '../block.js'

Blocks.bedrock = class Bedrock extends Block{
	static breaktime = Infinity
	static tool = 'pick'
	static blast = 2147483647
}

Blocks.barrier = class extends Block{
	static breaktime = Infinity
	static tool = 'pick'
	static blast = 2147483647
}
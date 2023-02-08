import { Block, Blocks } from '../block.js'

Blocks.bedrock = class Bedrock extends Block{
	static breaktime = Infinity
	static tool = 'pick'
}
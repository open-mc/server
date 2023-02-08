import { Block, Blocks } from '../block.js'

Blocks.dirt = class Dirt extends Block{
	static tool = 'shovel'
	static breaktime = 1.5
}
import { Block, Blocks } from '../block.js'

Blocks.stone = class Stone extends Block{
	static breaktime = 10
}

Blocks.obsidian = class Obsidian extends Block{
	static breaktime = 100
}
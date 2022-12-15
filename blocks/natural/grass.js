import { Block, Blocks } from '../block.js'

const GRASS = {
	tool: 'shovel',
	drops(silk){
		return silk ? [Items.grass()] : [Items.dirt()]
	}
}

Blocks.grass = Block.define(GRASS)

Blocks.snowy_grass = Block.define(GRASS)
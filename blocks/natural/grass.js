import { Block, Blocks } from '../block.js'

Blocks.grass = Block.define({
	tool: 'shovel',
	drops(silk){
		return silk ? [Items.grass()] : [Items.dirt()]
	}
})
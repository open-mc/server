import { Block, Blocks } from "../block.js";

Blocks.grass = new Block({
	tool: 'shovel',
	drops(silk){
		return silk ? [Items.grass()] : [Items.dirt()]
	}
})
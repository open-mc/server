import { Items } from "../../items/item.js"
import { Block, Blocks } from "../block.js"
import '../natural/stone.js'
import { Planks } from '../building/planks.js'

Blocks.crafting_table = class extends Planks{
	static tool = 'axe'
	static breaktime = 3
	drops(){ return new Items.crafting_table(1) }
}

Blocks.furnace = class extends Blocks.stone{
	static savedata = {}
	drops(){ return new Items.furnace(1) }
}

Blocks.lit_furnace = class extends Blocks.furnace{
}
import { Blocks } from "../../blocks/block.js"
import { placeblock } from "../../misc/ant.js"
import { Item, Items } from "../item.js"

Items.crafting_table = class extends Item{
	place(){ placeblock(Blocks.crafting_table); return 1 }
}

Items.furnace = class extends Item{
	place(){ placeblock(Blocks.furnace); return 1 }
}

Items.chest = class extends Item{
	place(){ const ch = new Blocks.chest(); ch.state = +(fx>.5); ch.name = this.name; placeblock(ch); return 1 }
}
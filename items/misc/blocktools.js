import { Blocks } from "../../blocks/block.js"
import { place } from "../../misc/ant.js";
import { Item, Items } from "../item.js"

Items.crafting_table = class extends Item{
	place(){ place(Blocks.crafting_table); super.use(1) }
}

Items.furnace = class extends Item{
	place(){ place(Blocks.furnace); super.use(1) }
}

Items.chest = class extends Item{
	place(fx, _){ const ch = new Blocks.chest(); ch.state = +(fx>.5); place(ch); super.use(1) }
}
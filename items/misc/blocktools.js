import { Blocks } from "../../blocks/block.js"
import { place } from "../../misc/ant.js";
import { Item, Items } from "../item.js"

Items.crafting_table = class extends Item{
	place(fx, fy, p){ place(Blocks.crafting_table); super.use(1, p) }
}

Items.furnace = class extends Item{
	place(fx, fy, p){ place(Blocks.furnace); super.use(1, p) }
}

Items.chest = class extends Item{
	place(fx, fy, p){ const ch = new Blocks.chest(); ch.state = +(fx>.5); ch.name = this.name; place(ch); super.use(1, p) }
}
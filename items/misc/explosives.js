import { Blocks } from "../../blocks/block.js"
import { Entities } from "../../entities/entity.js"
import { peek, place, summon } from "../../misc/ant.js"
import { Item, Items } from "../item.js"

Items.tnt = class extends Item{
	place(){ place(Blocks.tnt); super.use(true) }
}

Items.end_crystal = class extends Item{
	place(){ summon(Entities.end_crystal); super.use() }
}

Items.flint_and_steel = class extends Item{
	interact(){
		if(peek().constructor == Blocks.tnt){
			place(Blocks.air)
			const e = summon(Entities.tnt)
			e.dy = 5
			e.dx = random() * 4 - 2
		}
	}
}
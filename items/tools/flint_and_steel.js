import { blockevent, peek, place, summon } from "../../misc/ant.js"
import { Item, Items } from "../item.js"

Items.flint_and_steel = class extends Item{
	interact(b){
		if(b != Blocks.tnt) return
		place(Blocks.air)
		const e = summon(Entities.tnt)
		e.dy = 5
		e.dx = random() * 4 - 2
	}
	place(){
		place(Blocks.fire); blockevent(1)
	}
	static maxStack = 1
}
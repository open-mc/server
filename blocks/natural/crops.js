import { pop, peek, peekdown, place, push, up, destroy } from "../../misc/ant.js";
import { Block, Blocks } from "../block.js";

Blocks.sugar_cane = class extends Block{
	static breaktime = 0
	static solid = false
	randomtick(){ // happens on average every 3 mins 24s
		if(random() < .5){
			let length = 1
			push()
				down()
				while(peek() == Blocks.sugar_cane)
					length++, down()
			pop()
			up()
			if(length < 3 && peek() == Blocks.air)
				place(Blocks.sugar_cane)
		}
	}
	update(){
		if(!peekdown().solid) destroy() // drops item
	}
	// Single liners on one line unless you think you'll need to expand it in the future
	drops(){ return Items.sugar_cane(1) }
}
class PumpkinLeaf extends Block{
	static breaktime = 0
	static solid = false
}
Blocks.pumpkin_leaf = class extends PumpkinLeaf{
	randomtick(){
		place(Blocks.pumpkin_leaf1)
	}
}
Blocks.pumpkin_leaf1 = class extends PumpkinLeaf{
	randomtick(){
		place(Blocks.pumpkin_leaf2)
	}
}
Blocks.pumpkin_leaf2 = class extends PumpkinLeaf{
	randomtick(){
		place(Blocks.pumpkin_leaf3)
	}
}
Blocks.pumpkin_leaf3 = class extends PumpkinLeaf{
	randomtick(){
		push()
			if (right(), peek() == Blocks.pumpkin) return
		pop()
		push()
			if (left(), peek() == Blocks.pumpkin) return
		pop()

		random() < .5 ? left() : right()
		if(peek() == Blocks.air)
	      place(Blocks.pumpkin)
	}
}

//testing + gtg eat
function growthrate(){
	down()
	let soil = peek()
	if(soil != Blocks.farmland) return
	let points = soil.hydrated ? 4 : 2

}
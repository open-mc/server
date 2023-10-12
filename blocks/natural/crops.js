import { Items } from '../../items/item.js'
import { load, peek, peekdown, place, save, up, down } from '../../misc/ant.js'
import { Block, Blocks } from '../block.js'
import './grass.js'

Blocks.sugar_cane = class extends Block{
	static breaktime = 0
	static blockShape = []
	randomtick(){ // happens on average every 3 mins 24s
		if(random() < .5){
			let length = 1
			const a = save()
				down()
				while(peek() == Blocks.sugar_cane)
					length++, down()
			load(a)
			up()
			if(length < 3 && peek() == Blocks.air)
				place(Blocks.sugar_cane)
		}
	}
	update(){
		if(!peekdown().solid) this.destroy() // drops item
	}
	drops(){ return new Items.sugar_cane(1) }
}
class PumpkinLeaf extends Block{
	static breaktime = 0
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
		right()
		if (peek() == Blocks.pumpkin) return
		left(); left()
			if (peek() == Blocks.pumpkin) return
		right()

		random() < .5 ? left() : right()
		if(peek() == Blocks.air)
	      place(Blocks.pumpkin)
	}
}

Blocks.farmland = class extends Blocks.dirt{
	static blockShape = [0, 0, 1, 0.9375]
	randomtick(){

	}
}
Blocks.hydrated_farmland = class extends Blocks.dirt{
	static blockShape = [0, 0, 1, 0.9375]
	randomtick(){
		
	}
}

function growthRate(){
	down()
	const middle = save()
	// . . . . . . X . . . . . .
	let points = peek() == Blocks.hydrated_farmland ? 4 : 2
	let i = 6; while(i-- > 0){
		left()
		if (peek() == Blocks.hydrated_farmland)
			points += 1.5
		else if (peek() == Blocks.farmland)
			points += 1
		else break
	}
	// v v v v v v X . . . . . .
	load(middle)
	i = 6; while(i-- > 0){
		right()
		if (peek() == Blocks.hydrated_farmland)
			points += 1.5
		else if (peek() == Blocks.farmland)
			points += 1
		else break
	}
	// v v v v v v X v v v v v v
	return 1/(22/floor(points) + 1) //okay all crops need this algo
}
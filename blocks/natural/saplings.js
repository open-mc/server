import { Items } from "../../items/item.js"
import { down, left, peekdown, place, right, up } from "../../misc/ant.js"
import { Block, Blocks } from "../block.js"
import './leaves.js'
import './logs.js'

class Sapling extends Block{
	static solid = false
	static targettable = true
	static breaktime = 0
	update(){
		if(!peekdown().dirt) this.destroy(), place(Blocks.air)
	}
	randomtick(){
		if(random() < 1/3) this.placeTree?.()
	}
	grow(n){
		if(random() < n/5) this.placeTree?.()
	}
}
function genericTree(B, B2){
	const B3 = B2.behind
	return function(){
		let r = randint()
		let height = r&3; r >>= 2
		place(B3), up()
		while(height--){
			place(B3, true)
			up()
		}
		
		place(B2, true); up()
		place(B2, true); up()
		place(B2, true); up()
		place(B, true); right()
		place(B, true); left(); left()
		place(B, true); down()
		place(B, true); right(); right()
		place(B, true); down()
		place(B, true); right()
		if(r&3) place(B, true); down(); r >>= 2
		place(B, true); left()
		place(B, true); left(); left()
		place(B, true); left()
		place(B, true); up()
		if(r&3) place(B, true); right(); r >>= 2
		place(B, true)
	}
}

Blocks.oak_sapling = class extends Sapling{
	drops(){ return new Items.oak_sapling(1) }
	static placeTree = genericTree(Blocks.oak_leaves, Blocks.oak_log_leaves)
}

Blocks.birch_sapling = class extends Sapling{
	drops(){ return new Items.birch_sapling(1) }
	static placeTree = genericTree(Blocks.birch_leaves, Blocks.birch_log_leaves)
}

Blocks.spruce_sapling = class extends Sapling{
	drops(){ return new Items.spruce_sapling(1) }
	static placeTree = genericTree(Blocks.spruce_leaves, Blocks.spruce_log_leaves)
}

Blocks.dark_oak_sapling = class extends Sapling{
	drops(){ return new Items.dark_oak_sapling(1) }
	static placeTree = genericTree(Blocks.dark_oak_leaves, Blocks.dark_oak_log_leaves)
}

Blocks.acacia_sapling = class extends Sapling{
	drops(){ return new Items.acacia_sapling(1) }
	static placeTree = genericTree(Blocks.acacia_leaves, Blocks.acacia_log_leaves)
}

Blocks.jungle_sapling = class extends Sapling{
	drops(){ return new Items.jungle_sapling(1) }
	static placeTree = genericTree(Blocks.jungle_leaves, Blocks.jungle_log_leaves)
}
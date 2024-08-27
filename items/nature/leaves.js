import { Blocks } from "../../blocks/block.js"
import { placeblock } from "../../misc/ant.js"
import { Item, Items } from "../item.js"
import "../../blocks/index.js"

const leavesItem = (B, B2) => class extends Item{
	interact(b){
		if(b == B2.behind) return placeblock(B2), 1
	}
	place(){
		placeblock(B); return 1
	}
}

Items.oak_leaves = leavesItem(Blocks.oak_leaves, Blocks.oak_log_leaves)
Items.birch_leaves = leavesItem(Blocks.birch_leaves, Blocks.birch_log_leaves)
Items.spruce_leaves = leavesItem(Blocks.spruce_leaves, Blocks.spruce_log_leaves)
Items.dark_oak_leaves = leavesItem(Blocks.dark_oak_leaves, Blocks.dark_oak_log_leaves)
Items.acacia_leaves = leavesItem(Blocks.acacia_leaves, Blocks.acacia_log_leaves)
Items.jungle_leaves = leavesItem(Blocks.jungle_leaves, Blocks.jungle_log_leaves)
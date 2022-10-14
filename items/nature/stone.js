import { Blocks } from "../../blocks/block.js";
import { Item, Items } from "../item.js"

Items.stone = new Item({
	place(){
		return Blocks.stone()
	}
})
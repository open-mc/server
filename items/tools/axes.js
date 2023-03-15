import { Item, Items } from "../item.js"

Items.diamond_axe = class DiamondShovel extends Item{
	breaktime(block){
		return block.tool == 'axe' ? block.breaktime / 25 : block.breaktime
	}
	static maxStack = 1
}
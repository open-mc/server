import { Item, Items } from '../item.js'

Items.diamond_shovel = class DiamondShovel extends Item{
	breaktime(block){
		return block.tool == 'shovel' ? block.breaktime / 25 : block.breaktime
	}
	static maxStack = 1
}
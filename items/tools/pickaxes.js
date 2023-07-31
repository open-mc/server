import { Item, Items } from '../item.js'

Items.diamond_pickaxe = class DiamondPickaxe extends Item{
	breaktime(block){
		return block.tool == 'pick' ? block.breaktime / 25 : block.breaktime
	}
	static maxStack = 1
}
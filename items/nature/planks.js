import { Blocks } from '../../blocks/block.js'
import { Item, Items } from '../item.js'

Items.oak_planks = class OakPlanks extends Item{
	place(){ return Blocks.oak_planks }
}
import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.oak_planks = class OakPlanks extends Item{
	place(){ place(Blocks.oak_planks); super.use(true) }
}
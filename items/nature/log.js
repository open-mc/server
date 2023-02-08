import { Blocks } from '../../blocks/block.js'
import { Item, Items } from '../item.js'

Items.oak_log = class OakLog extends Item{
	interact(){ super.interact(Blocks.oak_log) }
}
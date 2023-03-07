import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.oak_log = class OakLog extends Item{
	place(){ place(Blocks.oak_log); super.use(true) }
}
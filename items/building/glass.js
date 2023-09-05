import { Item, Items } from '../item.js'
import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'

Items.glass = class Glass extends Item{
	place(){ place(Blocks.glass); super.use() }
}
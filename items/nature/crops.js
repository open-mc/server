import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.sugar_cane = class extends Item{
	place(){ place(Blocks.sugar_cane); super.use() }
}
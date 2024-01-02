import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.sand = class extends Item{
	place(fx, fy, p){ place(Blocks.sand); super.use(1, p) }
}
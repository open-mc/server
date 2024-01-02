import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.grass = class Grass extends Item{
	place(fx, fy, p){ place(Blocks.grass); super.use(1, p) }
}

Items.dirt = class Dirt extends Item{
	place(fx, fy, p){ place(Blocks.dirt); super.use(1, p) }
}
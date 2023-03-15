import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.grass = class Grass extends Item{
	place(){ place(Blocks.grass); super.use(true) }
}

Items.dirt = class Dirt extends Item{
	place(){ place(Blocks.dirt); super.use(true) }
}
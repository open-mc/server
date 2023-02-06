import { Blocks } from '../../blocks/block.js'
import { Item, Items } from '../item.js'

Items.grass = class Grass extends Item{
	place(){ return Blocks.grass }
}
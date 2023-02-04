import { Blocks } from '../../blocks/block.js'
import { Item, Items } from '../item.js'

Items.oak_planks = Item.define({
	place(){
		return Blocks.oak_planks()
	}
})
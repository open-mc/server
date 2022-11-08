import { Blocks } from '../../blocks/block.js'
import { Item, Items } from '../item.js'

Items.stone = Item.define({
	place(){
		return Blocks.stone()
	}
})
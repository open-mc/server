import { Block, Blocks } from '../block.js'
import { Item, Items } from '../../items/item.js'

Blocks.chest = class extends Block{
	items = Array.null(27)
	name = ''
	static tool = 'axe'
	static savedata = {
		items: [Item, 27],
		name: String
	}
	drops(){ return [new Items.chest(1), ...this.items] }
}
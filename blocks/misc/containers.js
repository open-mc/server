import { Block, Blocks } from '../block.js'
import { Item } from '../../items/item.js'

Blocks.chest = class Chest extends Block{
	items = [null, null, null, null, null, null, null, null, null,
					 null, null, null, null, null, null, null, null, null,
					 null, null, null, null, null, null, null, null, null]
	name = ''
	static tool = 'axe'
	static savedata = {
		items: [Item, 27],
		name: String
	}
}
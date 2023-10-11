import { Block, Blocks } from '../block.js'
import { Item } from '../../items/item.js'

Blocks.chest = class Chest extends Block{
	items = Array.null(27)
	name = ''
	static tool = 'axe'
	static savedata = {
		items: [Item, 27],
		name: String
	}
}
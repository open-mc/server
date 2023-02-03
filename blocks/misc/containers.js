import { Block, Blocks } from '../block.js'
import { Item } from '../../items/item.js'

Blocks.chest = Block.define({
	tool: 'axe',
}, {
	items: [Item,27],
	name: String
})

/*Blocks.chest = class extends Block{
	items = [null, null, null, null, null, null, null, null, null,
					 null, null, null, null, null, null, null, null, null,
					 null, null, null, null, null, null, null, null, null]
	name = ''
	static tool = 'axe'
	static savedata = {
		items: [Item,27],
		name: String
	}
}*/
import { Block, Blocks } from '../block.js'
import { Item, Items } from '../../items/item.js'

Blocks.chest = class extends Block{
	static blockShape = [1/16, 0, 15/16, 7/8]
	items = Array.null(27)
	name = ''
	state = 0
	static tool = 'axe'
	static blast = 30
	static savedata = {
		items: [Item, 27],
		name: String,
		state: Uint8
	}
	drops(){ return [new Items.chest(1), ...this.items] }
	interact(){
		
	}
}
import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

class Grass extends Block{
	static tool = 'shovel'
	static breaktime = 1.5
	drops(item){
		return Items.grass(1)
	}
}
Blocks.grass = Grass

Blocks.snowy_grass = class SnowyGrass extends Grass{
}
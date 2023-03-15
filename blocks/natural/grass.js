import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

class Grass extends Block{
	static tool = 'shovel'
	static breaktime = 1.5
	drops(tool){
		return Items.grass(1)
	}
}
Blocks.grass = Grass

Blocks.snowy_grass = class SnowyGrass extends Grass{
}

Blocks.dirt = class Dirt extends Block{
	static tool = 'shovel'
	static breaktime = 1
	drops(tool){
		return Items.dirt(1)
	}
}
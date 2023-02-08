import { Block, Blocks } from '../block.js'

class Grass extends Block{
	static tool = 'shovel'
	drops(item){
		return Items.grass(1)
	}
}
Blocks.grass = Grass

Blocks.snowy_grass = class SnowyGrass extends Grass{
}
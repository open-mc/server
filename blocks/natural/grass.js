import { Block, Blocks } from '../block.js'

class Grass extends Block{
	static tool = 'shovel'
	drops(silk){
		return silk ? [Items.grass(1)] : [Items.dirt(1)]
	}
}
Blocks.grass = Grass

Blocks.snowy_grass = class SnowyGrass extends Grass{
}
import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

//Template for defining a bunch of blocks
class Planks extends Block{
	static flammability = 5
	static tool = 'axe'
	static breaktime = 3
	drops(){ return Items.oak_planks }
}

//the actual blocks
Blocks.oak_planks = class extends Planks{}
Blocks.birch_planks = class extends Planks{}
Blocks.spruce_planks = class extends Planks{}
Blocks.dark_oak_planks = class extends Planks{}
Blocks.acacia_planks = class extends Planks{}
Blocks.jungle_planks = class extends Planks{}
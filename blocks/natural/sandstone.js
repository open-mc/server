import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

class Sandstone extends Block{
	static blast = 20
	static breaktime = 4
	static tool = 'pick'
	drops(){ return new Items.sandstone(1) }
}

Blocks.sandstone = Sandstone
Blocks.cut_sandstone = class extends Sandstone{}
Blocks.smooth_sandstone = class SmoothSandstone extends Sandstone{ //smooth is harder
	static blast = 30
	static breaktime = 10
}
Blocks.chiseled_sandstone = class extends Sandstone{}
Blocks.red_sandstone = class extends Sandstone{}
Blocks.cut_red_sandstone = class extends Sandstone{}
Blocks.chiseled_red_sandstone = class extends Sandstone{}
Blocks.smooth_red_sandstone = class SmoothRedSandstone extends Sandstone{ //smooth is harder
	static blast = 30
	static breaktime = 10
}

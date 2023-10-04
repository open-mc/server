import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

class Sandstone extends Item{
	place(){ place(Blocks.sandstone); super.use() }
}

Items.sandstone = Sandstone
Items.cut_sandstone = class extends Sandstone{}
Items.smooth_sandstone = class extends Sandstone{ //smooth is harder
	static blast = 30
	static breaktime = 10
}
Items.chiseled_sandstone = class extends Sandstone{}
Items.red_sandstone = class extends Sandstone{}
Items.cut_red_sandstone = class extends Sandstone{}
Items.chiseled_red_sandstone = class extends Sandstone{}
Items.smooth_red_sandstone = class extends Sandstone{ //smooth is harder
	static blast = 30
	static breaktime = 10
}
import { Block, Blocks } from '../block.js'

class Sandstone extends Block{
	static blast = 0.8
	static breaktime = 4
}

Blocks.sandstone = Sandstone
Blocks.cut_sandstone = class extends Sandstone{}
Blocks.smooth_sandstone = class SmoothSandstone extends Sandstone{ //smooth is harder
	static blast = 6
	static breaktime = 10
}
Blocks.chiseled_sandstone = class extends Sandstone{}
Blocks.red_sandstone = class extends Sandstone{}
Blocks.cut_red_sandstone = class extends Sandstone{}
Blocks.chiseled_red_sandstone = class extends Sandstone{}
Blocks.smooth_red_sandstone = class SmoothRedSandstone extends Sandstone{ //smooth is harder
	static blast = 6
	static breaktime = 10
}

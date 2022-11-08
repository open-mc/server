import { Block, Blocks } from '../block.js'

const SANDSTONE = {
	blast: 0.8,
	breaktime: 4
}

Blocks.sandstone = Block.define({...SANDSTONE})
Blocks.cut_sandstone = Block.define({...SANDSTONE})
Blocks.smooth_sandstone = Block.define({...SANDSTONE, blast: 6, breaktime: 10}) //smooth is harder
Blocks.chiseled_sandstone = Block.define({...SANDSTONE})
Blocks.red_sandstone = Block.define({...SANDSTONE})
Blocks.cut_red_sandstone = Block.define({...SANDSTONE})
Blocks.chiseled_red_sandstone = Block.define({...SANDSTONE})
Blocks.smooth_red_sandstone = Block.define({...SANDSTONE, blast: 6, breaktime: 10}) //smooth is harder

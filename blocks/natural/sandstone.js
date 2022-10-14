import { Block, Blocks } from "../block.js";

const SANDSTONE = {
	blast: 0.8,
	breaktime: 4
}

Blocks.sandstone = new Block({...SANDSTONE})
Blocks.cut_sandstone = new Block({...SANDSTONE})
Blocks.smooth_sandstone = new Block({...SANDSTONE, blast: 6, breaktime: 10}) //smooth is harder
Blocks.chiseled_sandstone = new Block({...SANDSTONE})
Blocks.red_sandstone = new Block({...SANDSTONE})
Blocks.cut_red_sandstone = new Block({...SANDSTONE})
Blocks.chiseled_red_sandstone = new Block({...SANDSTONE})
Blocks.smooth_red_sandstone = new Block({...SANDSTONE, blast: 6, breaktime: 10}) //smooth is harder

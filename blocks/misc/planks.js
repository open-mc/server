import { Block, Blocks } from '../block.js'

//Template for defining a bunch of blocks
const PLANKS = {flammability: 5, tool: 'axe', breaktime: 3}

//the actual blocks
Blocks.oak_planks = Block.define({...PLANKS})
Blocks.birch_planks = Block.define({...PLANKS})
Blocks.spruce_planks = Block.define({...PLANKS})
Blocks.dark_oak_planks = Block.define({...PLANKS})
Blocks.acacia_planks = Block.define({...PLANKS})
Blocks.jungle_planks = Block.define({...PLANKS})
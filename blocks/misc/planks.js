import { Block, Blocks } from "../block.js";

//Template for defining a bunch of blocks
const PLANKS = {flammability: 5, tool: 'axe', breaktime: 3}

//the actual blocks
Blocks.oak_planks = new Block({...PLANKS})
Blocks.birch_planks = new Block({...PLANKS})
Blocks.spruce_planks = new Block({...PLANKS})
Blocks.dark_oak_planks = new Block({...PLANKS})
Blocks.acacia_planks = new Block({...PLANKS})
Blocks.jungle_planks = new Block({...PLANKS})
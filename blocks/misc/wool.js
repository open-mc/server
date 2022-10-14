import { Block, Blocks } from "../block.js";
//Template for defining a bunch of blocks
const WOOL = {flammability: 30, tool: 'shears', breaktime: 1.2}
//the actual blocks
Blocks.white_wool = new Block({...WOOL, color: 'white'})
Blocks.light_grey_wool = new Block({...WOOL, color: 'light_grey'})
Blocks.grey_wool = new Block({...WOOL, color: 'grey'})
Blocks.black_wool = new Block({...WOOL, color: 'black'})
Blocks.red_wool = new Block({...WOOL, color: 'red'})
Blocks.orange_wool = new Block({...WOOL, color: 'orange'})
Blocks.yellow_wool = new Block({...WOOL, color: 'yellow'})
Blocks.lime_wool = new Block({...WOOL, color: 'lime'})
Blocks.green_wool = new Block({...WOOL, color: 'green'})
Blocks.cyan_wool = new Block({...WOOL, color: 'cyan'})
Blocks.light_blue_wool = new Block({...WOOL, color: 'light_blue'})
Blocks.blue_wool = new Block({...WOOL, color: 'blue'})
Blocks.purle_wool = new Block({...WOOL, color: 'purple'})
Blocks.magenta_wool = new Block({...WOOL, color: 'magenta'})
Blocks.pink_wool = new Block({...WOOL, color: 'pink'})
Blocks.brown_wool = new Block({...WOOL, color: 'brown'})
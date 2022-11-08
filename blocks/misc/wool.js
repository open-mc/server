import { Block, Blocks } from '../block.js'
//Template for defining a bunch of blocks
const WOOL = {flammability: 30, tool: 'shears', breaktime: 1.2}
//the actual blocks
Blocks.white_wool = Block.define({...WOOL, color: 'white'})
Blocks.light_grey_wool = Block.define({...WOOL, color: 'light_grey'})
Blocks.grey_wool = Block.define({...WOOL, color: 'grey'})
Blocks.black_wool = Block.define({...WOOL, color: 'black'})
Blocks.red_wool = Block.define({...WOOL, color: 'red'})
Blocks.orange_wool = Block.define({...WOOL, color: 'orange'})
Blocks.yellow_wool = Block.define({...WOOL, color: 'yellow'})
Blocks.lime_wool = Block.define({...WOOL, color: 'lime'})
Blocks.green_wool = Block.define({...WOOL, color: 'green'})
Blocks.cyan_wool = Block.define({...WOOL, color: 'cyan'})
Blocks.light_blue_wool = Block.define({...WOOL, color: 'light_blue'})
Blocks.blue_wool = Block.define({...WOOL, color: 'blue'})
Blocks.purle_wool = Block.define({...WOOL, color: 'purple'})
Blocks.magenta_wool = Block.define({...WOOL, color: 'magenta'})
Blocks.pink_wool = Block.define({...WOOL, color: 'pink'})
Blocks.brown_wool = Block.define({...WOOL, color: 'brown'})
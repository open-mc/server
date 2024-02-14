import { Blocks } from '../../blocks/block.js'
import { placeblock } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

class Log extends Item{

}

Items.oak_log = class extends Log{ place(){ placeblock(Blocks.oak_log); return 1 } }
Items.birch_log = class extends Log{ place(){ placeblock(Blocks.birch_log); return 1 } }
Items.spruce_log = class extends Log{ place(){ placeblock(Blocks.spruce_log); return 1 } }
Items.dark_oak_log = class extends Log{ place(){ placeblock(Blocks.dark_oak_log); return 1 } }
Items.acacia_log = class extends Log{ place(){ placeblock(Blocks.acacia_log); return 1 } }
Items.jungle_log = class extends Log{ place(){ placeblock(Blocks.jungle_log); return 1 } }
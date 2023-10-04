import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

class Log extends Item{

}

Items.oak_log = class extends Log{ place(){ place(Blocks.oak_log); super.use() } }
Items.birch_log = class extends Log{ place(){ place(Blocks.birch_log); super.use() } }
Items.spruce_log = class extends Log{ place(){ place(Blocks.spruce_log); super.use() } }
Items.dark_oak_log = class extends Log{ place(){ place(Blocks.dark_oak_log); super.use() } }
Items.acacia_log = class extends Log{ place(){ place(Blocks.acacia_log); super.use() } }
Items.jungle_log = class extends Log{ place(){ place(Blocks.jungle_log); super.use() } }
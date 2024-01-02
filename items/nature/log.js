import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

class Log extends Item{

}

Items.oak_log = class extends Log{ place(fx, fy, p){ place(Blocks.oak_log); super.use(1, p) } }
Items.birch_log = class extends Log{ place(fx, fy, p){ place(Blocks.birch_log); super.use(1, p) } }
Items.spruce_log = class extends Log{ place(fx, fy, p){ place(Blocks.spruce_log); super.use(1, p) } }
Items.dark_oak_log = class extends Log{ place(fx, fy, p){ place(Blocks.dark_oak_log); super.use(1, p) } }
Items.acacia_log = class extends Log{ place(fx, fy, p){ place(Blocks.acacia_log); super.use(1, p) } }
Items.jungle_log = class extends Log{ place(fx, fy, p){ place(Blocks.jungle_log); super.use(1, p) } }
import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

class Log extends Block{
	static breaktime = 5
	static tool = 'axe'
}

Blocks.oak_log = class extends Log{
	drops(){ return new Items.oak_log(1) }
}

Blocks.birch_log = class extends Log{
	drops(){ return new Items.birch_log(1) }
}

Blocks.spruce_log = class extends Log{
	drops(){ return new Items.spruce_log(1) }
}

Blocks.dark_oak_log = class extends Log{
	drops(){ return new Items.dark_oak_log(1) }
}

Blocks.acacia_log = class extends Log{
	drops(){ return new Items.acacia_log(1) }
}

Blocks.jungle_log = class extends Log{
	drops(){ return new Items.jungle_log(1) }
}
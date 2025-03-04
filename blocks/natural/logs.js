import { Items } from '../../items/item.js'
import { Block, BlockFlags, Blocks } from '../block.js'

class Log extends Block{
	static breaktime = 4
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

Blocks.oak_log_back = class extends Blocks.oak_log{ static flags = BlockFlags.SOLID | BlockFlags.TARGET_CAPTURE }
Blocks.birch_log_back = class extends Blocks.birch_log{ static flags = BlockFlags.SOLID | BlockFlags.TARGET_CAPTURE }
Blocks.spruce_log_back = class extends Blocks.spruce_log{ static flags = BlockFlags.SOLID | BlockFlags.TARGET_CAPTURE }
Blocks.dark_oak_log_back = class extends Blocks.dark_oak_log{ static flags = BlockFlags.SOLID | BlockFlags.TARGET_CAPTURE }
Blocks.acacia_log_back = class extends Blocks.acacia_log{ static flags = BlockFlags.SOLID | BlockFlags.TARGET_CAPTURE }
Blocks.jungle_log_back = class extends Blocks.jungle_log{ static flags = BlockFlags.SOLID | BlockFlags.TARGET_CAPTURE }
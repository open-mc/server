import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

class Wool extends Block{
	static flammability = 30
	static tool = 'shears'
	static breaktime = 1.2
}

Blocks.white_wool = class extends Wool{
	static color = 'white'
	drops(){ return new Items.white_wool() }
}
Blocks.light_grey_wool = class extends Wool{
	static color = 'light_grey'
	drops(){ return new Items.light_grey_wool() }
}
Blocks.grey_wool = class extends Wool{
	static color = 'grey'
	drops(){ return new Items.grey_wool() }
}
Blocks.black_wool = class extends Wool{
	static color = 'black'
	drops(){ return new Items.black_wool() }
}
Blocks.red_wool = class extends Wool{
	static color = 'red'
	drops(){ return new Items.red_wool() }
}
Blocks.orange_wool = class extends Wool{
	static color = 'orange'
	drops(){ return new Items.orange_wool() }
}
Blocks.yellow_wool = class extends Wool{
	static color = 'yellow'
	drops(){ return new Items.yellow_wool() }
}
Blocks.lime_wool = class extends Wool{
	static color = 'lime'
	drops(){ return new Items.lime_wool() }
}
Blocks.green_wool = class extends Wool{
	static color = 'green'
	drops(){ return new Items.green_wool() }
}
Blocks.cyan_wool = class extends Wool{
	static color = 'cyan'
	drops(){ return new Items.cyan_wool() }
}
Blocks.light_blue_wool = class extends Wool{
	static color = 'light_blue'
	drops(){ return new Items.light_blue_wool() }
}
Blocks.blue_wool = class extends Wool{
	static color = 'blue'
	drops(){ return new Items.blue_wool() }
}
Blocks.purple_wool = class extends Wool{
	static color = 'purple'
	drops(){ return new Items.purple_wool() }
}
Blocks.magenta_wool = class extends Wool{
	static color = 'magenta'
	drops(){ return new Items.magenta_wool() }
}
Blocks.pink_wool = class extends Wool{
	static color = 'pink'
	drops(){ return new Items.pink_wool() }
}
Blocks.brown_wool = class extends Wool{
	static color = 'brown'
	drops(){ return new Items.brown_wool() }
}
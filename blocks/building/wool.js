import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

class Wool extends Block{
	static flammability = 30
	static tool = 'shears'
	static breaktime = 1.2
}

Blocks.white_wool = class extends Wool{
	static color = 'white'
	drops(){ return Items.white_wool() }
}
Blocks.light_grey_wool = class extends Wool{
	static color = 'light_grey'
	drops(){ return Items.light_grey_wool() }
}
Blocks.grey_wool = class extends Wool{
	static color = 'grey'
	drops(){ return Items.grey_wool() }
}
Blocks.black_wool = class extends Wool{
	static color = 'black'
	drops(){ return Items.black_wool() }
}
Blocks.red_wool = class extends Wool{
	static color = 'red'
	drops(){ return Items.red_wool() }
}
Blocks.orange_wool = class extends Wool{
	static color = 'orange'
	drops(){ return Items.orange_wool() }
}
Blocks.yellow_wool = class extends Wool{
	static color = 'yellow'
	drops(){ return Items.yellow_wool() }
}
Blocks.lime_wool = class extends Wool{
	static color = 'lime'
	drops(){ return Items.lime_wool() }
}
Blocks.green_wool = class extends Wool{
	static color = 'green'
	drops(){ return Items.green_wool() }
}
Blocks.cyan_wool = class extends Wool{
	static color = 'cyan'
	drops(){ return Items.cyan_wool() }
}
Blocks.light_blue_wool = class extends Wool{
	static color = 'light_blue'
	drops(){ return Items.light_blue_wool() }
}
Blocks.blue_wool = class extends Wool{
	static color = 'blue'
	drops(){ return Items.blue_wool() }
}
Blocks.purple_wool = class extends Wool{
	static color = 'purple'
	drops(){ return Items.purple_wool() }
}
Blocks.magenta_wool = class extends Wool{
	static color = 'magenta'
	drops(){ return Items.magenta_wool() }
}
Blocks.pink_wool = class extends Wool{
	static color = 'pink'
	drops(){ return Items.pink_wool() }
}
Blocks.brown_wool = class extends Wool{
	static color = 'brown'
	drops(){ return Items.brown_wool() }
}
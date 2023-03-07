import { Block, Blocks } from '../block.js'

class Wool extends Block{
	static flammability = 30
	static tool = 'shears'
	static breaktime = 1.2
}

Blocks.white_wool = class extends Wool{
	static color = 'white'
}
Blocks.light_grey_wool = class extends Wool{
	static color = 'light_grey'
}
Blocks.grey_wool = class extends Wool{
	static color = 'grey'
}
Blocks.black_wool = class extends Wool{
	static color = 'black'
}
Blocks.red_wool = class extends Wool{
	static color = 'red'
}
Blocks.orange_wool = class extends Wool{
	static color = 'orange'
}
Blocks.yellow_wool = class extends Wool{
	static color = 'yellow'
}
Blocks.lime_wool = class extends Wool{
	static color = 'lime'
}
Blocks.green_wool = class extends Wool{
	static color = 'green'
}
Blocks.cyan_wool = class extends Wool{
	static color = 'cyan'
}
Blocks.light_blue_wool = class extends Wool{
	static color = 'light_blue'
}
Blocks.blue_wool = class extends Wool{
	static color = 'blue'
}
Blocks.purple_wool = class extends Wool{
	static color = 'purple'
}
Blocks.magenta_wool = class extends Wool{
	static color = 'magenta'
}
Blocks.pink_wool = class extends Wool{
	static color = 'pink'
}
Blocks.brown_wool = class extends Wool{
	static color = 'brown'
}
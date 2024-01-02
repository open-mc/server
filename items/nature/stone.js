import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.stone = class extends Item{
	place(fx, fy, p){ place(Blocks.stone); super.use(1, p) }
}
Items.cobblestone = class extends Item{
	place(fx, fy, p){ place(Blocks.cobblestone); super.use(1, p) }
}

Items.netherrack = class extends Item{
	place(fx, fy, p){ place(Blocks.netherrack); super.use(1, p) }
}

Items.obsidian = class extends Item{
	place(fx, fy, p){ place(Blocks.obsidian); super.use(1, p) }
}
Items.glowing_obsidian = class extends Items.obsidian{
	place(fx, fy, p){ place(Blocks.glowing_obsidian); super.use(1, p) }
}
Items.bedrock = class extends Item{
	place(fx, fy, p){ place(Blocks.bedrock); super.use(1, p) }
}


Items.endstone = class extends Item{
	place(fx, fy, p){ place(Blocks.endstone); super.use(1, p) }
}
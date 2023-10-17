import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.stone = class extends Item{
	place(){ place(Blocks.stone); super.use(1) }
}
Items.cobblestone = class extends Item{
	place(){ place(Blocks.cobblestone); super.use(1) }
}

Items.netherrack = class extends Item{
	place(){ place(Blocks.netherrack); super.use(1) }
}

Items.obsidian = class extends Item{
	place(){ place(Blocks.obsidian); super.use(1) }
}
Items.glowing_obsidian = class extends Items.obsidian{
	place(){ place(Blocks.glowing_obsidian); super.use(1) }
}
Items.bedrock = class extends Item{
	place(){ place(Blocks.bedrock); super.use(1) }
}


Items.endstone = class extends Item{
	place(){ place(Blocks.endstone); super.use(1) }
}
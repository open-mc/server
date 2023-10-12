import { Blocks } from '../../blocks/block.js'
import { place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.stone = class extends Item{
	place(){ place(Blocks.stone); super.use() }
}
Items.cobblestone = class extends Item{
	place(){ place(Blocks.cobblestone); super.use() }
}

Items.netherrack = class extends Item{
	place(){ place(Blocks.netherrack); super.use() }
}

Items.obsidian = class extends Item{
	place(){ place(Blocks.obsidian); super.use() }
}
Items.glowing_obsidian = class extends Items.obsidian{
	place(){ place(Blocks.glowing_obsidian); super.use() }
}
Items.bedrock = class extends Item{
	place(){ place(Blocks.bedrock); super.use() }
}


Items.endstone = class extends Item{
	place(){ place(Blocks.endstone); super.use() }
}
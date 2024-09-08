import { Enchantments } from '../../items/enchantments.js'
import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'
import './logs.js'

class Leaves extends Block{
	static breaktime = 0.5
	static tool = 'hoe'
	static transparent = true
	drops(item, sapling){
		if(random() < .125) return new sapling(1)
		if(random() < .06) return new Items.stick(floor(random()*2))
	}
}

Blocks.oak_leaves = class extends Leaves{
	drops(item){
		if(item?.ench?.has(Enchantments.silk_touch)) return new Items.oak_leaves(1)
		if(random() < .02) return new Items.apple(1)
		return super.drops(item, Items.oak_sapling)
	}
}

Blocks.birch_leaves = class extends Leaves{
	drops(item){
		if(item?.ench?.has(Enchantments.silk_touch)) return new Items.birch_leaves(1)
		return super.drops(item, Items.birch_sapling)
	}
}

Blocks.spruce_leaves = class extends Leaves{
	drops(item){
		if(item?.ench?.has(Enchantments.silk_touch)) return new Items.spruce_leaves(1)
		return super.drops(item, Items.spruce_sapling)
	}
}

Blocks.dark_oak_leaves = class extends Leaves{
	drops(item){
		if(item?.ench?.has(Enchantments.silk_touch)) return new Items.dark_oak_leaves(1)
		if(random() < .005) return new Items.apple(1)
		return super.drops(item, Items.dark_oak_sapling)
	}
}

Blocks.acacia_leaves = class extends Leaves{
	drops(item){
		if(item?.ench?.has(Enchantments.silk_touch)) return new Items.acacia_leaves(1)
		return super.drops(item, Items.acacia_sapling)
	}
}

Blocks.jungle_leaves = class extends Leaves{
	drops(item){
		if(item?.ench?.has(Enchantments.silk_touch)) return new Items.jungle_leaves(1)
		return super.drops(item, Items.jungle_sapling)
	}
}


Blocks.oak_log_leaves = class extends Blocks.oak_leaves{
	static behind = Blocks.oak_log
}

Blocks.birch_log_leaves = class extends Leaves{
	static behind = Blocks.birch_log
}

Blocks.spruce_log_leaves = class extends Leaves{
	static behind = Blocks.spruce_log
}

Blocks.dark_oak_log_leaves = class extends Leaves{
	static behind = Blocks.dark_oak_log
}

Blocks.acacia_log_leaves = class extends Leaves{
	static behind = Blocks.acacia_log
}

Blocks.jungle_log_leaves = class extends Leaves{
	static behind = Blocks.jungle_log
}
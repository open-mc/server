import { Blocks } from '../../blocks/block.js'
import { itemify, slabifyItem } from '../../blocks/blockshapes.js'
import { Items } from '../item.js'
import '../../blocks/building/planks.js'

Items.oak_planks = itemify(Blocks.oak_planks)
Items.birch_planks = itemify(Blocks.birch_planks)
Items.spruce_planks = itemify(Blocks.spruce_planks)
Items.dark_oak_planks = itemify(Blocks.dark_oak_planks)
Items.acacia_planks = itemify(Blocks.acacia_planks)
Items.jungle_planks = itemify(Blocks.jungle_planks)

Items.oak_planks_slab = slabifyItem(Items.oak_planks, Blocks.oak_planks)
Items.birch_planks_slab = slabifyItem(Items.birch_planks, Blocks.birch_planks)
Items.spruce_planks_slab = slabifyItem(Items.spruce_planks, Blocks.spruce_planks)
Items.dark_oak_planks_slab = slabifyItem(Items.dark_oak_planks, Blocks.dark_oak_planks)
Items.acacia_planks_slab = slabifyItem(Items.acacia_planks, Blocks.acacia_planks)
Items.jungle_planks_slab = slabifyItem(Items.jungle_planks, Blocks.jungle_planks)
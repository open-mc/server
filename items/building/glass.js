import { Items } from '../item.js'
import { Blocks } from '../../blocks/block.js'
import { itemify } from '../../blocks/blockshapes.js'
import '../../blocks/building/glass.js'

Items.glass = itemify(Blocks.glass)

Items.glowstone = itemify(Blocks.glowstone)
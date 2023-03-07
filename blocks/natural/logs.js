import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'

Blocks.oak_log = class OakLog extends Block{
  static breaktime = 5
	static tool = 'axe'
	drops(i){ return Items.oak_log(1) }
}
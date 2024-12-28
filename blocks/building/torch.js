import { Items } from '../../items/item.js'
import { soliddown, solidleft, solidright, place } from '../../misc/ant.js'
import { Block, BlockFlags, Blocks } from '../block.js'

Blocks.torch = class extends Block{
	static flags = BlockFlags.TARGETTABLE | BlockFlags.FRAGILE
	static breaktime = 0
	static blast = 15
	static blockShape = [7/16, 0, 9/16, 10/16]
	drops(){ return new Items.torch() }
	update(){
		if(!soliddown()) this.destroy(), place(Blocks.air)
	}
}
Blocks.torch_left = class extends Blocks.torch{
	static blockShape = [12/16, 3/16, 1, 13/16]
	update(){
		if(!solidleft()) this.destroy(), place(Blocks.air)
	}
}
Blocks.torch_right = class extends Blocks.torch{
	static blockShape = [0, 3/16, 4/16, 13/16]
	update(){
		if(!solidright()) this.destroy(), place(Blocks.air)
	}
}
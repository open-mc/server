import { Item, Items } from '../item.js'
import { Blocks } from '../../blocks/block.js'
import { placeblock, peekdown, peekleft, peekright } from '../../misc/ant.js'

Items.torch = class extends Item{
	place(fx, fy){
		const sd = peekdown().solid, sl = peekleft().solid, sr = peekright().solid
		let b = fx < .2 ? Blocks.torch_left : fx > .8 ? Blocks.torch_right : Blocks.torch
		if(b == Blocks.torch_left && !sl) b = Blocks.torch
		if(b == Blocks.torch_right && !sr) b = Blocks.torch
		if(b == Blocks.torch && !sd) b = sr?sl?fx>=.5?Blocks.torch_right:Blocks.torch_left:Blocks.torch_right:sl?Blocks.torch_left:null
		if(b) return placeblock(b), 1
	}
}
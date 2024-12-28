import { Blocks, BlockFlags } from '../../blocks/block.js'
import { down, peek, peekleft, peekright, placeblock, up } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.sugar_cane = class extends Item{
	place(fx, fy){
		down()
		const l = peekleft(), r = peekright(), b = peek()
		if((((!l.source | l.fluidType != 'water') & (!r.source | r.fluidType != 'water')) | !(b.flags&BlockFlags.SOLID_TOP)) & b != Blocks.sugar_cane) return
		up()
		placeblock(Blocks.sugar_cane)
		return 1
	}
}
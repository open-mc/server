import { Blocks } from '../../blocks/block.js'
import { down, peek, peekleft, peekright, placeblock, up } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.sugar_cane = class extends Item{
	place(fx, fy){
		down()
		const l = peekleft(), r = peekright(), b = peek()
		if((((l.flows !== false | l.fluidType != 'water') & (r.flows !== false | r.fluidType != 'water')) | !b.solid) & b != Blocks.sugar_cane) return
		up()
		placeblock(Blocks.sugar_cane)
		return 1
	}
}
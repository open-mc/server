import { Blocks } from '../../blocks/block.js'
import { down, peek, peekleft, peekright, place, up } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.sugar_cane = class extends Item{
	place(fx, fy, p){
		down()
		const l = peekleft(), r = peekright(), b = peek()
		if((((l.flows !== false | l.fluidType != 'water') & (r.flows !== false | r.fluidType != 'water')) | !b.solid) & b != Blocks.sugar_cane) return
		up()
		place(Blocks.sugar_cane)
		super.use(1, p)
	}
}
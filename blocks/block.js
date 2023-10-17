import { Entities } from '../entities/entity.js'
import { Item } from '../items/item.js'
import { getX, getY, place, antWorld, gridevent } from '../misc/ant.js'

export class Block{
	[Symbol.for('nodejs.util.inspect.custom')](){ return `Blocks.${this.className}${this.savedata ? ' {...}' : ''}` }
	static flammability = 0
	static breaktime = 3
	static blast = 20
	static solid = true
	static replacable = false
	static mustBreak = false
	static tool = ''
	static savedata = null
	get nonSolidAndReplacable(){return !this.solid & (this.replacable|this.targettable)}
	destroy(sound = true, drop = this.drops?.(), replace = Blocks.air){
		if(sound) gridevent(2)
		place(replace)
		if(drop instanceof Item){
			const itm = new Entities.item()
			itm.item = drop
			itm.dx = random() * 6 - 3
			itm.dy = 6
			itm.place(antWorld, getX(), getY())
		}else if(drop instanceof Array){
			for(const d of drop){
				if(!d) continue
				const itm = new Entities.item()
				itm.item = d
				itm.dx = random() * 6 - 3
				itm.dy = 6
				itm.place(antWorld, getX(), getY())
			}
		}
	}
}
Object.setPrototypeOf(Block.prototype, null)
export const Blocks = Object.create(null)
export const BlockIDs = []
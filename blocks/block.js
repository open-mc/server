import { Entities } from "../entities/entity.js"
import { Item } from "../items/item.js"
import { blockevent, getX, getY, place, antWorld } from "../misc/ant.js"

export class Block{
	[Symbol.for('nodejs.util.inspect.custom')](){ return `Blocks.${this.className}${this.savedata ? ' {...}' : ''}` }
	static flammability = 0
	static breaktime = 3
	static blast = 20
	static solid = true
	static tool = ''
	static savedata = null
	destroy(sound = true, drop = this.drops?.()){
		if(sound) blockevent(2)
		place(Blocks.air)
		if(drop instanceof Item){
			const itm = Entities.item()
			itm.item = drop
			itm.dx = random() * 6 - 3
			itm.dy = 6
			itm.place(antWorld, getX(), getY())
		}else if(drop instanceof Array){
			for(const d of drop){
				const itm = Entities.item()
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
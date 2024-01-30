import { Entities } from '../entities/entity.js'
import { Item } from '../items/item.js'
import { getX, getY, place, antWorld, gridevent, antChunk } from '../misc/ant.js'

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
	getItem(id, slot){return null}
	setItem(id, slot, item){}
	swapItems(id, slot, item){
		const a = this.getItem(id, slot)
		this.setItem(id, slot, item)
		this.itemChanged(id, slot, item)
		return a
	}
	putItems(id, slot, stack){
		const i = this.getItem(id, slot)
		if(!i){
			const s = new stack.constructor(stack.count)
			if(this.swapItems(id, slot, s) !== s) return stack.count = 0, this.itemChanged(id, slot, s), null
			return stack
		}
		if(i.constructor != stack.constructor || i.savedata) return stack
		const c = min(stack.count, i.maxStack - i.count)
		stack.count -= c
		i.count += c
		this.itemChanged(id, slot, i)
		return stack.count ? stack : null
	}
	takeItems(id, slot, count = Infinity){
		const i = this.getItem(id, slot)
		count = min(i.count, count)
		i.count -= count
		if(!i.count) this.setItem(id, slot, null)
		this.itemChanged(id, slot, i.count?i:null)
		if(!count) return null
		return new i.constructor(count)
	}
	itemChanged(id = 0, slot, item = this.getItem(id, slot)){
		if(!antChunk) return
		for(const sock of antChunk.sockets){
			let {ibuf, ibufLastB, ibufLastA} = sock
			if(!sock.ibuf) (sock.ibuf = ibuf = new DataWriter()).byte(32)
			const x = getX(), y = getY() - (id+1)*4294967296
			if(ibufLastA != x || ibufLastB != y){
				ibuf.byte(129)
				ibuf.int(x); ibuf.int(y|0)
				ibuf.byte(id)
				sock.ibufLastA = x
				sock.ibufLastB = y
			}			
			ibuf.byte(slot)
			Item.encode(ibuf, item)
		}
	}
	static isBlock = true
}
Object.setPrototypeOf(Block.prototype, null)
export const Blocks = Object.create(null)
export const BlockIDs = []
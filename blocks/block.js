import { Entities } from '../entities/entity.js'
import { Item } from '../items/item.js'
import { getX, getY, place, antWorld, gridevent, antChunk } from '../misc/ant.js'
import { EphemeralInterface } from '../misc/ephemeralinterface.js'

export class Block{
	[Symbol.for('nodejs.util.inspect.custom')](){ return `Blocks.${this.className}${this.savedata ? ' {...}' : ''}` }
	static flammability = 0
	static breaktime = 3
	static blast = 20
	static solid = true
	static targettable = false
	static replaceable = false
	static mustBreak = false
	static tool = ''
	static savedata = null
	destroy(sound = true, drop = this.drops?.()){
		if(sound) gridevent(2)
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
	getItem(id, slot){}
	setItem(id, slot, item){}
	static slotClicked = EphemeralInterface.prototype.slotClicked
	static slotAltClicked = EphemeralInterface.prototype.slotAltClicked
	static mapItems = EphemeralInterface.prototype.mapItems
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
import { Item } from '../items/item.js'
import { getX, getY, gridevent, antChunk, summonDrops } from '../misc/ant.js'
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
	destroy(sound = true){
		if(sound) gridevent(2)
		summonDrops(this.drops?.())
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
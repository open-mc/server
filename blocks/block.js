import { Item } from '../items/item.js'
import { getX, getY, gridevent, antChunk, summonDrops } from '../misc/ant.js'
import { EphemeralInterface } from '../misc/ephemeralinterface.js'

export const BlockFlags = {
	NONE: 0,
	SOLID: 15,
	SOLID_LEFT: 1,
	SOLID_RIGHT: 2,
	SOLID_HORIZONTAL: 3,
	SOLID_BOTTOM: 4,
	SOLID_TOP: 8,
	SOLID_VERTICAL: 12,
	HARD: 240,
	HARD_LEFT: 16,
	HARD_RIGHT: 32,
	HARD_HORIZONTAL: 48,
	HARD_BOTTOM: 64,
	HARD_TOP: 128,
	HARD_VERTICAL: 192,
	SOLID_HARD: 255,
	TARGETTABLE: 256,
	TARGET_BLOCKING: 512,
	TARGET_CAPTURE: 768,
	TARGET_FLUID: 1024,
	CLIMBABLE: 2048,
	OVERWRITABLE: 4096,
	FRAGILE: 8192,
	REPLACEABLE: 12288,
}

export class Block{
	[Symbol.for('nodejs.util.inspect.custom')](){ return `Blocks.${this.className}${this.savedata ? ' {...}' : ''}` }
	static flammability = 0
	static breaktime = 3
	static blast = 20
	static flags = BlockFlags.SOLID | BlockFlags.HARD | BlockFlags.TARGET_CAPTURE
	get fragile(){return (this.flags&8192)!=0}
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
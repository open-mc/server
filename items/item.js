import { Entity } from "../entities/entity.js"
import { blockevent, place, summon } from "../misc/ant.js"
import { registerTypes } from "../utils/data.js"

export class Item{
	constructor(count = 1){
		this.count = count
		this.name = ''
	}
	[Symbol.for('nodejs.util.inspect.custom')](){ return 'Items.'+this.className+'(\x1b[33m'+this.count+'\x1b[m)' }
	static savedata = null
	static burns = false
	static maxStack = 64
	breaktime(block){ return block.breaktime }
	use(b = true){
		if(b) blockevent(3)
		this.count--
	}
	static decode(buf, target){
		const count = buf.getUint8(buf.i++)
		if(!count)return null
		const item = ItemIDs[buf.getUint16(buf.i)]
		buf.i += 2
		if(!item)return null
		if(!target)target = item(count)
		else target.count = count, Object.setPrototypeOf(target, Object.getPrototypeOf(item))
		target.name = buf.string()
		if(target.savedata)buf.read(target.savedatahistory[buf.flint()] || target.savedata, target)
		return target
	}
	static encode(buf, v){
		if(buf.i > buf.cur.byteLength - 3)buf.allocnew();
		if(!v){buf.cur.setUint8(buf.i++, 0); return}
		buf.cur.setUint8(buf.i++, v.count)
		buf.cur.setUint16(buf.i, v.id); buf.i += 2
		buf.string(v.name)
		if(v.savedata)buf.write(v.savedatahistory[buf.flint()] || v.savedata, v)
	}
}
registerTypes({Item})
Object.setPrototypeOf(Item.prototype, null)
export const Items = Object.create(null)
export const ItemIDs = []
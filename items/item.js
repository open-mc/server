import { gridevent } from '../misc/ant.js'
import { registerTypes } from '../modules/dataproto.js'

export class Item{
	constructor(count = 0, name = ''){
		this.count = count || 1
		this.name = name
	}
	[Symbol.for('nodejs.util.inspect.custom')](){ return 'Items.'+this.className+'(\x1b[33m'+this.count+'\x1b[m)' }
	static savedata = null
	static burns = false
	static maxStack = 64
	breaktime(block){ return block.breaktime }
	static decode(buf, target){
		const count = buf.flint2()
		if(!count) return null
		const item = ItemIDs[buf.getUint16(buf.i)]
		buf.i += 2
		if(!item) return null
		if(!target) target = new item(count)
		else target.count = count, Object.setPrototypeOf(target, Object.getPrototypeOf(item))
		target.name = buf.string()
		if(target.savedata) buf.read(target.savedatahistory[buf.flint()] || target.savedata, target)
		return target
	}
	static encode(buf, v){
		if(buf.i > buf.cur.byteLength - 3) buf.allocnew()
		if(!v || !v.count){buf.cur.setUint8(buf.i++, 0); return}
		buf.flint2(v.count)
		buf.cur.setUint16(buf.i, v.id); buf.i += 2
		buf.string(v.name)
		if(v.savedata)buf.flint(v.savedatahistory.length), buf.write(v.savedata, v)
	}
}
registerTypes({Item})
Object.setPrototypeOf(Item.prototype, null)
export const Items = Object.create(null)
export const ItemIDs = []
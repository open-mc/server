import { gridevent } from '../misc/ant.js'
import { registerTypes } from '../modules/dataproto.js'

export class Item{
	constructor(count = 0, name = ''){
		this.count = count || 1
		this.name = name
	}
	[Symbol.for('nodejs.util.inspect.custom')](){ return 'Items.'+this.className+'(\x1b[33m'+this.count+'\x1b[m)' }
	static savedata = null
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
		if(v.savedata) buf.flint(v.savedatahistory.length), buf.write(v.savedata, v)
	}
	stackableWith(other){
		if(this.constructor != other.constructor || this.name != other.name) return false
		if(!this.savedata) return true
		deepCompare(this.savedata, this, other)
	}
	copy(count = this.count, name = this.name){
		const other = new this.constructor(count, name)
		if(this.savedata) deepAssign(this.savedata, this, other)
		return other
	}
}
function deepCompare(T, a, b){
	for(const k in T){
		const v1 = a[k], v2 = b[k]
		if(v1 instanceof Item || Array.isArray(v1)) return false
		if(v1 == null) return v2 == null
		if(v2 == null) return false
		if(typeof v1 == 'object'){ if(!deepCompare(T[k], v1, v2)) return false }
		else if(v1 != v2) return false
	}
	return true
}
function deepAssign(T, a, b){
	if(Array.isArray(T)){let i=0;for(const v of a){
		if(v instanceof Item) b[i++] = v.copy()
		else if(typeof v == 'object' && v) deepAssign(T[0], v, b[i++] ??= Array.isArray(v) ? [] : {})
		else b[i++] = v
	}}else for(const k in T){
		const v = a[k]
		if(v instanceof Item) b[k] = v.copy()
		else if(typeof v == 'object' && v) deepAssign(T[k], v, b[k] ??= Array.isArray(v) ? [] : {})
		else b[k] = v
	}
}
registerTypes({Item})
Object.setPrototypeOf(Item.prototype, null)
export const Items = Object.create(null)
export const ItemIDs = []
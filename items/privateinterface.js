import { Item } from "./item.js"

export class EphemeralInterface{
	sock = null
	getItem(id, slot){return null}
	setItem(id, slot, item){}
	swapItems(id, slot, item){
		const a = this.getItem(id, slot)
		this.setItem(id, slot, item)
		this.itemChanged(id, slot, item)
		return a
	}
	putItems(id, slot, stack){
		if(!stack) return null
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
	itemChanged(id, slot, item){
		let {ibufLastA, ibufLastB, ibuf} = this.sock
		if(ibufLastB !== Infinity || ibufLastA != id){
			if(ibufLastB != ibufLastB) (this.sock.ibuf = ibuf = new DataWriter).byte(32)
			ibuf.byte(130)
			ibuf.byte(id)
			this.sock.ibufLastA = id
			this.sock.ibufLastB = Infinity
		}
		ibuf.byte(slot)
		Item.encode(ibuf, item)
	}
}
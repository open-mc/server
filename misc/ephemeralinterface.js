import { Item } from "../items/item.js"

export class EphemeralInterface{
	sock = null
	getItem(id, slot){return undefined}
	setItem(id, slot, item){}
	slotClicked(id, slot, holding, player){
		const t = this.getItem(id, slot)
		if(t === undefined) return holding
		if(!t && !holding) return
		if(t&&holding&&(t.constructor!==holding.constructor||t.savedata)){
			this.setItem(id, slot, holding)
			this.itemChanged(id, slot, holding)
		}else if(t && !holding){
			this.setItem(id, slot, null)
			this.itemChanged(id, slot, null)
		}else{
			if(!t){
				this.setItem(id, slot, holding)
				this.itemChanged(id, slot, holding)
				return null
			}
			if(t.constructor !== holding.constructor || t.savedata) return holding
			const c = min(holding.count, t.maxStack - t.count)
			holding.count -= c
			t.count += c
			this.setItem(id, slot, t)
			this.itemChanged(id, slot, t)
			return holding.count ? holding : null
		}
		return t
	}
	slotAltClicked(id, slot, holding, player){
		const t = this.getItem(id, slot)
		if(t === undefined) return holding
		if(!t && !holding) return
		if(t && !holding){
			const count = t.count>>1
			if(!count) return null
			if(!(t.count -= count)) this.setItem(id, slot, null)
			this.itemChanged(id, slot, t.count ? t : null)
			return new t.constructor(count)
		}else if(t&&holding&&(t.constructor!==holding.constructor||t.savedata)){
			this.setItem(id, slot, holding)
			this.itemChanged(id, slot, holding)
			return t
		}else{
			if(!t){
				const stack = new holding.constructor(1)
				this.setItem(id, slot, stack)
				this.itemChanged(id, slot, stack)
			}else if(t.constructor === holding.constructor && !t.savedata && t.count < t.maxStack){
				t.count++
				this.setItem(id, slot, t)
				this.itemChanged(id, slot, t)
			}else return holding
			return --holding.count ? holding : null
		}
	}
	mapItems(id, cb){
		for(let slot = 0;;slot++){
			const t = this.getItem(id, slot)
			if(t === undefined) return
			const t2 = cb(t)
			if(t2 !== undefined){
				this.setItem(id, slot, t2)
				this.itemChanged(id, slot, t2)
			}
		}
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
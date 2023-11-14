import { Item } from "./item.js"

export class EphemeralInterface{
	sock = null
	getItem(id, slot){return null}
	setItem(id, slot, item, force){return true}
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
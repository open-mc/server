import { Item } from '../../items/item.js'
import { Entities, Entity } from '../entity.js'

Entities.item = class ItemEntity extends Entity{
	item = null
	static width = 0.16
	static height = 0.32
	static collisionPaddingX = 1
	static collisionPaddingY = 0.5
	static head = 0.2
	static savedata = {item: Item}
	damage(){ this.remove() }
	touch(e){
		if(!this.item){
			this.remove()
			return
		}
		if(e instanceof ItemEntity && e.age >= 10 && e.item && e.item.constructor == this.item.constructor && !this.item.savedata && this.world){
			const maxRemovable = max(0, 32767 - this.item.count)
			if(maxRemovable >= e.item.count){
				if(this.item.count < e.item.count)
					this.x = e.x, this.y = e.y
				this.item.count += e.item.count
				this.event(2, buf => buf.byte(this.item.count))
				e.remove()
			}else{
				this.item.count += maxRemovable
				this.event(2, buf => buf.byte(this.item.count))
				e.item.count -= maxRemovable
			}
			return
		}
		if(this.age < 10 || !e.inv) return
		if(this.item.count !== (e.give(this.item), this.item.count)){
			const c = this.item.count
			this.event(1, buf => buf.byte(c))
			if(!this.item.count) this.remove()
		}
	}
}
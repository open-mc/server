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
	damage(t,e){ if(!(e instanceof Entity)) this.remove() }
	touch(e){
		if(!this.item){
			this.remove()
			return
		}
		if(e instanceof ItemEntity && e.age >= 10 && e.item && e.item.stackableWith(this.item) && this.world){
			const maxRemovable = max(0, 255 - this.item.count)
			if(maxRemovable >= e.item.count){
				if(this.item.count < e.item.count)
					this.x = e.x, this.y = e.y
				this.item.count += e.item.count
				this.event(2, buf => buf.byte(this.item.count))
				e.remove()
			}else{
				const c = this.item.count += maxRemovable
				this.event(2, buf => buf.byte(c))
				e.item.count -= maxRemovable
			}
			return
		}
		if(this.age < 10 || !e.inv) return
		let c = this.item.count
		if(c !== (c = (this.item = e.give(this.item))?.count ?? 0)){
			this.event(1, buf => buf.byte(c))
			if(!c) this.remove()
		}
	}
}
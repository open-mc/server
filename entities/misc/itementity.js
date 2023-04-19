import { Item } from '../../items/item.js'
import { Entities, Entity } from '../entity.js'

Entities.item = class ItemEntity extends Entity{
	item = null
	static width = 0.125
	static height = 0.25
	static collisionTestPadding = 0.5
	static head = 0.125
	static savedata = {item: Item}
	touch(e){
		if(!this.item){
			this.remove()
			return
		}
		if(e instanceof ItemEntity && e.item && e.item.constructor == this.item.constructor && !this.item.savedata && this.world){
			const maxRemovable = 255 - this.item.count
			if(maxRemovable >= e.item.count){
				e.remove()
				if(this.item.count < e.item.count)
				this.x = e.x, this.y = e.y
				this.item.count += e.item.count
			}else{
				this.item.count += maxRemovable
				e.item.count -= maxRemovable
			}
			this.event(2, buf => buf.byte(this.item.count))
			return
		}
		if(this.age < 10 || !e.inv) return
		if(e.give(this.item)){
			this.event(1)
			if(this.item.count <= 0) this.remove()
		}
	}
}
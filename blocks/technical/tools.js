import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'
import '../natural/stone.js'
import { Planks } from '../building/planks.js'
import { Entities } from '../../entities/entity.js'
import { EphemeralInterface } from '../../items/privateinterface.js'

class CraftingInterface extends EphemeralInterface{
	static kind = 1
	slots = [null, null, null, null, null, null, null, null, null]
	output = null; canProduce = 0
	getItem(id, slot){ return id == 1 ? this.output : id == 0 && slot < 9 ? this.slots[slot] : null }
	setItem(id, slot, item){
		if(id == 1) this.output = item
		else if(slot < 9) this.slots[slot] = item
		this.calculateOutput()
	}
	calculateOutput(){
		this.output = null; this.canProduce = 0
		if(this.slots[4]?.id === Items.oak_log.id) this.output = new Items.oak_planks(4), this.canProduce = this.slots[4].count
		this.itemChanged(1, 0)
	}
	putItems(id, slot, item){
		if(id == 0) return super.putItems(id, slot, item)
		else return item
	}
	takeItems(id, slot, count){
		if(id == 0) return super.takeItems(id, slot, count)
		else if(this.output){
			const count = min(floor(this.output.maxStack/this.output.count), this.canProduce)
			const s = new this.output.constructor(count*this.output.count)
			let changed = false
			for(let i = 0; i < 9; i++) if(this.slots[i] && (this.slots[i].count-=count)<=0) this.slots[i] = null, changed = true
			if(changed) this.calculateOutput()
			return s
		}
	}
	swapItems(id, slot, item){
		if(id == 0) return super.swapItems(id, slot, item)
		else return item
	}
	interfaceClosed(id, player){
		if(id == 0){
			for(let i = 0; i < 9; i++){
				const itm = this.slots[i]
				if(!itm) continue
				player.giveAndDrop(itm)
				this.itemChanged(0, i, this.slots[i] = null)
			}
		}
	}
}

Blocks.crafting_table = class extends Planks{
	static tool = 'axe'
	static breaktime = 3
	drops(){ return new Items.crafting_table(1) }
	interact(_, player){
		player.openInterface(new CraftingInterface, 0)
		return 0
	}
}

Blocks.furnace = class extends Blocks.stone{
	static savedata = {}
	drops(){ return new Items.furnace(1) }
}

Blocks.lit_furnace = class extends Blocks.furnace{
}
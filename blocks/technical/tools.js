import { Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'
import '../natural/stone.js'
import { Planks } from '../building/planks.js'
import { Entities } from '../../entities/entity.js'
import { EphemeralInterface } from '../../items/privateinterface.js'

class CraftingInterface extends EphemeralInterface{
	static kind = 1
	slots = [null, null, null, null, null, null, null, null, null]
	output = null
	getItem(id, slot){ return slot == 10 ? this.output : slot < 10 ? this.slots[slot] : null }
	setItem(id, slot, item, force = false){
		if(slot >= 10+force) return true
		if(slot == 10) this.output = item
		else this.slots[slot] = item
		super.itemChanged(id, slot, item)
		// TODO calculate crafting output into output
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
	}
}

Blocks.furnace = class extends Blocks.stone{
	static savedata = {}
	drops(){ return new Items.furnace(1) }
}

Blocks.lit_furnace = class extends Blocks.furnace{
}
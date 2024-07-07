import { Item, Items } from '../../items/item.js'
import { Block, Blocks } from '../block.js'
import '../natural/stone.js'
import { Planks } from '../building/planks.js'
import { Entities } from '../../entities/entity.js'
import { EphemeralInterface } from '../../misc/ephemeralinterface.js'
import { getOutput, smeltMap } from '../../misc/crafting.js'
import { blockevent, update } from '../../misc/ant.js'

class CraftingInterface extends EphemeralInterface{
	static kind = 1
	slots = [null, null, null, null, null, null, null, null, null]
	output = null; canProduce = 0; leftovers = null
	getItem(id, slot){ return slot == 9 ? this.output : slot < 9 ? this.slots[slot] : undefined }
	setItem(id, slot, item){
		if(slot == 9) this.output = item
		else if(slot < 9) this.slots[slot] = item
		this.calculateOutput()
	}
	calculateOutput(){
		const match = getOutput(this.slots)
		if(match){
			const {output, count, leftovers} = match
			this.output = new output(count)
			this.leftovers = leftovers
			this.canProduce = 0
			for(const i of this.slots) if(i&&i.count>this.canProduce) this.canProduce = i.count
		}else this.output = null, this.canProduce = 0, this.leftovers = null
		this.itemChanged(0, 9, this.output)
	}
	slotClicked(id, slot, holding, player){
		if(slot < 9) return super.slotClicked(id, slot, holding, player)
		if(!this.output) return
		let count = this.output.count
		if(holding){
			if(this.output.constructor === holding.constructor && !this.output.savedata) count = min(count, this.output.maxStack - holding.count)
			else return
		}
		count = min(this.canProduce, floor(count/this.output.count))
		if(holding) holding.count += count*this.output.count
		else holding = new this.output.constructor(count*this.output.count)
		let changed = false
		for(let i = 0; i < 9; i++){
			if(!this.slots[i]) continue
			if((this.slots[i].count-=count)<=0) this.slots[i] = null, changed = true
			this.itemChanged(0, i, this.slots[i])
		}
		if(changed) this.calculateOutput()
		else this.itemChanged(0, 9, this.output), this.canProduce -= count
		return holding
	}
	slotAltClicked(id, slot, holding, player){
		if(slot < 9) return super.slotAltClicked(id, slot, holding, player)
		if(!this.output) return
		let count = this.output.maxStack
		if(holding){
			if(this.output.constructor === holding.constructor && !this.output.savedata) count = this.output.maxStack - holding.count
			else return
		}
		count = min(this.canProduce, floor(count/this.output.count))
		if(holding) holding.count += count*this.output.count
		else holding = new this.output.constructor(count*this.output.count)
		let changed = false
		for(let i = 0; i < 9; i++){
			if(!this.slots[i]) continue
			if((this.slots[i].count-=count)<=0) this.slots[i] = null, changed = true
			this.itemChanged(0, i, this.slots[i])
		}
		if(changed) this.calculateOutput()
		else this.itemChanged(0, 9, this.output), this.canProduce -= count
		return holding
	}
	interfaceClosed(id, player){
		for(let i = 0; i < 9; i++){
			const itm = this.slots[i]
			if(!itm) continue
			player.giveAndDrop(itm)
			this.itemChanged(0, i, this.slots[i] = null)
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
	input = null; fuel = null; output = null; cookTime = 0; fuelTime = 0
	getItem(id, slot){return slot == 0 ? this.input : slot == 1 ? this.fuel : slot == 2 ? this.output : undefined}
	setItem(id, slot, item){
		if(slot == 0) this.input = item
		else if(slot == 1) this.fuel = item
		else if(slot == 2) this.output = item
		this.calcCook()
	}
	calcCook(){
		if(!this.input || this.cookTime) return
		const m = smeltMap.get(this.input.id)
		if(m && (!this.output || (this.output.count < this.output.maxStack && this.output.constructor === m.output)) && this.fuel){
			this.fuelTime = round(this.fuel.canSmelt * 200)||200
			this.cookTime = 200
			this.sendTimes()
			if(!--this.fuel.count) this.fuel = null
			this.itemChanged(0, 1, this.fuel)
			update()
		}
	}
	static savedata = {
		input: Item, fuel: Item, output: Item, cookTime: Byte, fuelTime: Short
	}
	drops(){ return [this.input, this.output, this.fuel, new Items.furnace(1)] }
	interact(_, player){
		player.openInterface(this, 0)
		return 0
	}
	sendTimes(){
		blockevent(10, buf => {
			buf.byte(this.cookTime)
			buf.short(this.fuelTime)
			buf.short(this.fuel ? round(this.fuel.canSmelt * 200)||200 : 0)
		})
	}
	update(a){
		if(this.fuelTime <= 0){
			if(!this.cookTime) return
			else if((this.cookTime += 2) > 200) return void(this.cookTime = 0, this.sendTimes())
			else return a
		}
		this.fuelTime--
		if(!this.cookTime) return a
		if(!this.fuelTime && this.cookTime && this.fuel){
			this.fuelTime = round(this.fuel.canSmelt * 200)||200
			this.sendTimes()
			if(!--this.fuel.count) this.fuel = null
			this.itemChanged(0, 1, this.fuel)
		}
		const m = smeltMap.get(this.input?.id)
		if(!m || (this.output && (m.output !== this.output.constructor || this.output.count >= this.output.maxStack))) return this.cookTime = 0, this.sendTimes(), a
		if(!--this.cookTime){
			if(this.output) this.output.count++
			else this.output = new m.output(1)
			if(!--this.input.count) this.input = null
			this.itemChanged(0, 0, this.input)
			this.itemChanged(0, 2, this.output)
			if((!this.output || this.output.count < this.output.maxStack) && this.fuelTime && this.input) this.cookTime = 200, this.sendTimes()
		}
		return a
	}
	slotClicked(id, slot, holding, player){
		if(slot == 1 && holding && !holding.canSmelt) return holding
		else if(slot < 2) return super.slotClicked(id, slot, holding, player)
		if(holding) return holding
		const o = this.output
		this.output = null
		this.itemChanged(0, 2, null)
		this.calcCook()
		return o
	}
	slotAltClicked(id, slot, holding, player){
		if(slot == 1 && holding && !holding.canSmelt) return holding
		else if(slot < 2) return super.slotAltClicked(id, slot, holding, player)
		if(holding || !this.output) return holding
		const o = this.output
		if(!--this.output.count) this.output = null
		this.itemChanged(0, 2, this.output)
		this.calcCook()
		return new o.constructor(1)
	}
}
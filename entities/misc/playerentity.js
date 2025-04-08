import { Item } from '../../items/item.js'
import { ChunkLoader } from '../chunkloader.js'
import { Entities } from '../entity.js'
import { LivingEntity } from './living.js'
import { getOutput4 } from '../../misc/crafting.js'

const defaultSkin = Uint8Array.from(atob('AH9/AH9/AH9/AFtbAH9/AH9/AH9/AH9/AH9/AH9/AH9/AH9/MChyMChyJiFbMChyMChyMChyJiFbMChyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH9/AGhoAGhoAH9/AGhoAGhoAGhoAH9/AH9/AGhoAGhoAH9/MChyJiFbJiFbMChyMChyMChyJiFbMChyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGhoAGhoAGhoAH9/AH9/AGhoAGhoAH9/AH9/AGhoAGhoAH9/MChyJiFbMChyMChyMChyMChyJiFbMChyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFtbAGhoAGhoAFtbAH9/AGhoAGhoAH9/AH9/AGhoAGhoAH9/MChyJiFbMChyMChyMChyMChyJiFbMChyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGhoAFtbAFtbAFtbll9Bll9Bll9Bh1U7ll9Bll9Bll9Bh1U7MChyJiFbMChyMChyMChyJiFbMChyMChyKBsKKBsKJhoKJxsLKRwMMiMQLSAQLSAQAFtbAFtbAFtbAGholl9Bll9Bll9Bh1U7ll9Bll9Bh1U7ll9BMChyJiFbMChyMChyMChyJiFbJiFbMChyKBsKKBsKJhoKJhoKLB4OKRwMKx4NMyQRAGhoAFtbAFtbAGhoh1U7ll9Bll9Bh1U7ll9Bll9Bh1U7ll9BMChyJiFbMChyMChyMChyMChyJiFbMChyLB4OJhgLJhoKKRwMKx4OKBsLJBgKKRwMAH9/AGhoAGhoAH9/h1U7ll9Bll9Bll9Bh1U7ll9Bh1U7ll9BMChyMChyMChyMChyMChyMChyJiFbMChyKBsKKBoNLR0OLB4OKBsKJxsLLB4OLyIRAH9/AGhoAGhoAH9/h1U7ll9Bh1U7ll9Bh1U7ll9Bll9Bll9BMChyMChyMChyMChyMChyMChyMChyMChyKBsKKBsKKBsKJhoMIxcJh1g6nGNFOigUAH9/AGhoAH9/AH9/ll9Bll9Bh1U7ll9Bll9Bll9Bll9Bll9BPz8/Pz8/MChyMChyPz8/Pz8/MChyMChyKBsKKBsKKBoNJhgLLB4RhFIxll9BiFo5MChyJiFbMChyJiFbll9Bll9Bh1U7ll9Bll9Bh1U7ll9Bh1U7Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/LB4OKBsKLR0OYkMvnWpPmmNEhlM0dUcvMChyJiFbMChyMChyll9Bll9Bll9Bll9Bll9Bll9Bll9Bh1U7Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/hlM0hlM0mmNEhlM0nGdIll9Bilk7dEgv'), c => c.charCodeAt())
let src, dest
// Function for copying 3 bytes from an rgb u8 image buffer to a 5x5 area in an rgba u32 image buffer
const c3t4_5 = new Uint8Array(Uint16Array.of(1).buffer)[0] === 1
? (p, o) => {
	dest[p    ] = dest[p + 1] = dest[p + 2] = dest[p + 3] = dest[p + 4] =
	dest[p +64] = dest[p +65] = dest[p +66] = dest[p +67] = dest[p +68] =
	dest[p+128] = dest[p+129] = dest[p+130] = dest[p+131] = dest[p+132] =
	dest[p+192] = dest[p+193] = dest[p+194] = dest[p+195] = dest[p+196] =
	dest[p+256] = dest[p+257] = dest[p+258] = dest[p+259] = dest[p+260] =
		src[o*=3] | src[o+1] << 8 | src[o+2] << 16 | 0xFF000000
}
: (p, o) => {
	dest[p    ] = dest[p + 1] = dest[p + 2] = dest[p + 3] = dest[p + 4] =
	dest[p +64] = dest[p +65] = dest[p +66] = dest[p +67] = dest[p +68] =
	dest[p+128] = dest[p+129] = dest[p+130] = dest[p+131] = dest[p+132] =
	dest[p+192] = dest[p+193] = dest[p+194] = dest[p+195] = dest[p+196] =
	dest[p+256] = dest[p+257] = dest[p+258] = dest[p+259] = dest[p+260] =
		src[o*=3] << 16 | src[o+1] << 8 | src[o+2] | 255
}

Entities.player = class Player extends ChunkLoader(LivingEntity){
	inv = Array.null(37)
	items = [null, null, null, null, null]
	craftingSlots = [null, null, null, null]
	getItem(id, slot){
		return id == 0 && slot < 36 ? this.inv[slot] : id == 1 ? slot < 5 ? this.items[slot] : slot < 9 ? this.craftingSlots[slot-5] : slot == 10 ? this.output : undefined : id == 2 && slot == 0 ? this.inv[36] : undefined
	}
	setItem(id, slot, item){
		if(id == 0 && slot < 36) this.inv[slot] = item
		else if(id == 1){
			if(slot < 5) this.items[slot] = item
			else if(slot < 9) this.craftingSlots[slot-5] = item, this.calculateOutput()
			else if(slot == 10) this.output = item
		}else if(id == 2) this.inv[36] = item
	}
	static allInterfaces = [0, 1, 2]
	selected = 0
	skin = defaultSkin
	rubberMv = 0
	static width = 0.3
	get height(){return this.state & 2 ? 1.5 : 1.8}
	get head(){return this.state & 2 ? 1.4 : 1.6}
	static portalWait = 80
	toString(){
		return `\x1b[33m${this.name}\x1b[m \x1b[31m${this.health/2} ♥\x1b[m`
	}
	static savedata = {
		health: Byte,
		inv: [Item, 37],
		items: [Item, 5],
		craftingSlots: [Item, 4],
		selected: Byte,
		skin: Uint8Array
	}
	_avatar = null
	getAvatar(){
		if(this._avatar) return this._avatar
		src = this.skin; dest = new Int32Array(4096)
		// draw shoulder at x=22, y=49 (to x=42, y=64)
		c3t4_5(3158, 4); c3t4_5(3163, 5); c3t4_5(3168, 6); c3t4_5(3173, 7)
		c3t4_5(3478,32); c3t4_5(3483,33); c3t4_5(3488,34); c3t4_5(3493,35)
		c3t4_5(3798,60); c3t4_5(3803,61); c3t4_5(3808,62); c3t4_5(3813,63)
		// draw head at x=12, y=9
		for(let i = 0; i < 64; i++)
			c3t4_5(588 + (i&7)*5 + (i>>3)*320, 132 + (i&7) + (i>>3)*28)
		this._avatar = PNG.write(dest, 64, 64)
		this._avatar.then(a=>this._avatar=a)
		return this._avatar
	}
	getName(){ return this.name }
	output = null
	canProduce = 0
	leftovers = null
	calculateOutput(){
		const match = getOutput4(this.craftingSlots)
		if(match){
			const {output, count, leftovers} = match
			this.output = new output(count)
			this.leftovers = leftovers
			this.canProduce = Infinity
			for(const i of this.craftingSlots) if(i&&i.count<this.canProduce) this.canProduce = i.count
			if(this.canProduce == Infinity) this.canProduce = 0
		}else this.output = null, this.canProduce = 0, this.leftovers = null
		this.itemChanged(1, 10, this.output)
	}
	slotClicked(id, slot, holding, player){
		if(id != 1 || slot < 9) return super.slotClicked(id, slot, holding, player)
		if(!this.output) return
		let count = this.output.count
		if(holding){
			if(this.output.stackableWith(holding)) count = min(count, this.output.maxStack - holding.count)
			else return
		}
		count = min(this.canProduce, floor(count/this.output.count))
		if(holding) holding.count += count*this.output.count
		else holding = this.output.copy(count*this.output.count)
		let changed = false
		for(let i = 0; i < 4; i++){
			if(!this.craftingSlots[i]) continue
			if((this.craftingSlots[i].count-=count)<=0) this.craftingSlots[i] = null, changed = true
			this.itemChanged(1, i+5, this.craftingSlots[i])
		}
		if(changed) this.calculateOutput()
		else this.itemChanged(1, 10, this.output), this.canProduce -= count
		return holding
	}
	slotAltClicked(id, slot, holding, player){
		if(id != 1 || slot < 9) return super.slotAltClicked(id, slot, holding, player)
		if(!this.output) return
		let count = this.output.maxStack
		if(holding){
			if(this.output.stackableWith(holding)) count = this.output.maxStack - holding.count
			else return
		}
		count = min(this.canProduce, floor(count/this.output.count))
		if(holding) holding.count += count*this.output.count
		else holding = this.output.copy(count*this.output.count)
		let changed = false
		for(let i = 0; i < 4; i++){
			if(!this.craftingSlots[i]) continue
			if((this.craftingSlots[i].count-=count)<=0) this.craftingSlots[i] = null, changed = true
			this.itemChanged(1, i+5, this.craftingSlots[i])
		}
		if(changed) this.calculateOutput()
		else this.itemChanged(1, 10, this.output), this.canProduce -= count
		return holding
	}
}
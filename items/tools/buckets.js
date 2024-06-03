import { Blocks } from '../../blocks/block.js'
import { antChunk, blockevent, peek, place } from '../../misc/ant.js'
import { Dimensions } from '../../world/index.js'
import { Item, Items } from '../item.js'

Items.bucket = class extends Item{
	interact(b, p){
		if(b.fluidLevel && !b.flows){
			blockevent(34)
			place(Blocks.air)
			let i = null
			switch(b.fluidType){
				case 'water':
					i = new Items.bucket_of_water()
					break
				case 'lava':
					i = new Items.bucket_of_lava()
					break
			}
			if(this.count > 1) return i && p.giveAndDrop(i), 1
			else return i
		}
	}
	static interactFluid = true
	static maxStack = 16
}

Items.bucket_of_water = class extends Item{
	place(){
		if(antChunk.world == Dimensions.nether){
			const b = peek()
			place(Blocks.water)
			blockevent(32)
			place(b)
		}else place(Blocks.water), blockevent(33)
		return new Items.bucket()
	}
	static maxStack = 1
}

Items.bucket_of_lava = class extends Item{
	place(){
		place(Blocks.lava); blockevent(33); return new Items.bucket()
	}
	static maxStack = 1
}
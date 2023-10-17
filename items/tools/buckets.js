import { Blocks } from '../../blocks/block.js'
import { antWorld, blockevent, peek, place } from '../../misc/ant.js'
import { Dimensions } from '../../world/index.js'
import { Item, Items } from '../item.js'

Items.bucket = class extends Item{
	interact(b, e){
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
			if(this.count > 1) super.use(), i && e.giveAndDrop(i)
			else return i
		}
	}
	static interactFluid = true
	static maxStack = 16
}

Items.bucket_of_water = class extends Item{
	place(){
		if(antWorld == Dimensions.nether){
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
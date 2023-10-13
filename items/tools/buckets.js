import { Blocks } from '../../blocks/block.js'
import { blockevent, place } from '../../misc/ant.js'
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
				case 'lava':
					i = new Items.bucket_of_lava()
			}
			if(this.count) this.count--, i && e.give(i)
			else return i
		}
	}
	static interactFluid = true
	static maxStack = 16
}

Items.bucket_of_water = class extends Item{
	place(){
		place(Blocks.water); blockevent(33); return new Items.bucket()
	}
	static maxStack = 1
}

Items.bucket_of_lava = class extends Item{
	place(){
		place(Blocks.lava); blockevent(33); return new Items.bucket()
	}
	static maxStack = 1
}
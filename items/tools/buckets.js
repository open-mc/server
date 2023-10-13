import { Blocks } from '../../blocks/block.js'
import { blockevent, place } from '../../misc/ant.js'
import { Item, Items } from '../item.js'

Items.bucket = class extends Item{
	interact(b){
		if(b.fluidLevel && !b.flows){
			blockevent(34)
			place(Blocks.air)
			switch(b.fluidType){
				case 'water':
					return new Items.bucket_of_water()
				case 'lava':
					return new Items.bucket_of_lava()
			}
		}
	}
	static interactFluid = true
	static maxStack = 1
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
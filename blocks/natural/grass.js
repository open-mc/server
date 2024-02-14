import { Enchantments } from '../../items/enchantments.js'
import { Items } from '../../items/item.js'
import { down, getX, getY, jump, peekleft, peekright, peekup, place, up } from '../../misc/ant.js'
import { Block, Blocks } from '../block.js'

class Grass extends Block{
	static tool = 'shovel'
	static breaktime = 1.5
	static dirt = true
	drops(item){
		return item?.ench?.has(Enchantments.silk_touch) ? new Items.grass(1) : new Items.dirt(1)
	}
	randomtick(){
		if(peekup().solid)
			place(Blocks.dirt)
	}
}
Blocks.grass = Grass

Blocks.snowy_grass = class SnowyGrass extends Grass{
}

Blocks.dirt = class Dirt extends Block{
	static tool = 'shovel'
	static breaktime = 1
	static dirt = true
	drops(){
		return new Items.dirt(1)
	}
	randomtick(){
		if(peekup().solid) return
		check: {
			if(peekright() == Blocks.grass || peekleft() == Blocks.grass) break check // y=~
			up()
			if(peekright() == Blocks.grass || peekleft() == Blocks.grass){ down(); break check } //y=~1
			up()
			if(peekright() == Blocks.grass || peekleft() == Blocks.grass){ jump(0,-2); break check } //y=~2
			jump(0,-3)
			if(peekright() == Blocks.grass || peekleft() == Blocks.grass){ up(); break check } //y=~-1
			down()
			if(peekright() == Blocks.grass || peekleft() == Blocks.grass){ jump(0,2); break check } //y=~-2
			return
		}
		// Successfully found nearby grass block, now spread
		place(Blocks.grass)
	}
}
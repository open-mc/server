import { Block, Blocks } from '../block.js'
import { Item, Items } from '../../items/item.js'
import { blockevent } from '../../misc/ant.js'

Blocks.chest = class extends Block{
	static blockShape = [1/16, 0, 15/16, 7/8]
	items = Array.null(27)
	name = ''
	state = 0
	playersWatching = 0
	static tool = 'axe'
	static blast = 30
	static savedata = {
		items: [Item, 27],
		name: String,
		state: Uint8
	}
	drops(){ return [new Items.chest(1, this.name), ...this.items] }
	static interfaceList = [0]
	interact(_, player){
		player.openInterface(this, 0)
	}
	interfaceOpened(){
		if(!this.playersWatching++){
			this.state|=2
			blockevent(1, buf => buf.byte(this.state))
		}
	}
	interfaceClosed(){
		if(!--this.playersWatching){
			this.state&=~2
			blockevent(1, buf => buf.byte(this.state))
		}
	}
	interface(id){ return id == 0 ? this.items : undefined }
}
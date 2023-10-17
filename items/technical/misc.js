import { Blocks } from '../../blocks/block.js'
import { antChunk, jump, peek, place, right } from '../../misc/ant.js'
import { GAMERULES } from '../../world/index.js'
import { Item, Items } from '../item.js'

Items.end_portal_frame = class extends Item{
	place(){ place(Blocks.end_portal_frame); super.use(1) }
}

Items.eye_of_ender = class extends Item{
	interact(b){
		if(b != Blocks.end_portal_frame) return
		place(Blocks.filled_end_portal_frame)
		super.use(1)
		check: {
			jump(4,0)
			if(peek() == Blocks.filled_end_portal_frame) {jump(-3,0); break check}
			jump(-8,0)
			if(peek() == Blocks.filled_end_portal_frame) {right(); break check}
			return
		}
		place(Blocks.end_portal)
		right(); place(Blocks.end_portal)
		right(); place(Blocks.end_portal)
		// Global Sound Event
		if(GAMERULES.globalevents){
			sock.entity.world.event(52)
		}else for(const sock of antChunk.sockets){
			sock.entity.worldEvent(52)
		}
	}
}
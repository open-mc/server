import { BlockFlags, BlockIDs, Blocks } from "../../blocks/block.js"
import { goto, peek, place, summonDrops } from "../../misc/ant.js"
import { Entities, Entity } from "../entity.js"

Entities.falling_block = class extends Entity{
	static width = 0.49
	static height = 0.98
	block = 0
	static gy = 0.75
	static savedata = {block: Uint16}
	update(){
		super.update()
		if(this.impactDy < 0){
			goto(this)
			const bl = peek()
			if(bl.fragile){
				bl.destroy?.(false)
				place(BlockIDs[this.block] ?? Blocks.air)
				return void this.remove()
			}else{
				summonDrops((BlockIDs[this.block] ?? Blocks.air).drops?.())
				return void this.remove()
			}
		}
		if(this.age > 1200) return void this.remove()
	}
}
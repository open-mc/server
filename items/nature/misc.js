import { gridevent } from "../../misc/ant.js"
import { Item, Items } from "../item.js"

Items.bone_meal = class extends Item{
	interact(b){
		if(b.grow){
			b.grow(floor(random()*3+1))
			super.use(10)
		}
	}
}
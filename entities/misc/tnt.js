import { Entities, Entity } from "../entity.js";

Entities.tnt = class extends Entity{
	static width = 0.495
	static height = 0.99
	tick(){
		if(this.age == 1) this.event(1)
		if(this.age == 75)this.event(2)
		else if(this.age >= 80){
			this.remove()
			this.event(3)
		}
	}
}
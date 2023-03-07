import { Entities, Entity } from "../entity.js";

Entities.tnt = class extends Entity{
	static width = 0.49
	static height = 0.98
	tick(){
		if(this.age == 75)this.event(1)
		else if(this.age >= 80){
			this.remove()
			
		}
	}
}
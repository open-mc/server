import { Entity } from "./entity.js"

export class LivingEntity extends Entity{
	health = 20
	static maxHealth = 20
	damage(amount, dealer){
		this.health -= amount
		if(this.health <= 0){
			this.event(99)
			this.died()
			this.age = -20
		}else if(this.health > this.maxHealth){
			this.health = this.maxHealth
		}
	}
	died(){}
}
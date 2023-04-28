import { Entity } from "./entity.js"

export class LivingEntity extends Entity{
	health = 20
	static maxHealth = 20
	damage(amount, dealer){
		this.health = min(this.maxHealth, max(0, this.health - amount))
		this.event(99, buf => buf.short(this.health << 8 | 1))
		if(!this.health){
			this.died?.()
		}
	}
}
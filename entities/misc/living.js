import { Entity } from "../entity.js"
import { DXDY } from "../entity.js"

export class LivingEntity extends Entity{
	health = 20
	static maxHealth = 20
	damage(amount, dealer){
		this.health = min(this.maxHealth, max(0, this.health - amount))
		this.event(99, buf => buf.short(this.health << 8 | 1))
		if(dealer){
			this.dx += sign(this.x-dealer.x) * 6; this.dy = dealer.dy / 2 + 6
			if(this.sock) this.rubber(DXDY)
		}
		if(!this.health){
			this.died?.()
		}
	}
	
}
import { goto, peek } from '../../misc/ant.js'
import { damageTypes } from '../deathmessages.js'
import { Entity } from '../entity.js'
import { DXDY } from '../entity.js'

export class LivingEntity extends Entity{
	health = 20
	static maxHealth = 20
	static stepHeight = 0.5
	damage(amount, dealer){
		if(dealer == damageTypes.fire || dealer == damageTypes.water || dealer == damageTypes.burning || dealer == damageTypes.suffocation){
			const now = Date.now()
			// damageTypes.fire deals every 500ms
			if(this.lastNaturalDamage + (dealer!=damageTypes.fire&&dealer!=damageTypes.suffocation)*500+500 > now) return
			this.lastNaturalDamage = now
		}
		this.health = min(this.maxHealth, max(0, this.health - amount))
		this.event(99, buf => buf.short(this.health << 8 | 1 | dealer << 2))
		if(dealer instanceof Entity){
			this.dx += sign(this.x-dealer.x) * 6; this.dy = dealer.dy / 2 + 6
			if(this.sock) this.rubber(DXDY)
		}
		if(!this.health) this.kill(dealer)
	}
	lastNaturalDamage = 0
	update(){
		if(this.world.tick%10==0){
			let x = floor(this.x), y = floor(this.y + this.head)
			const {solid, blockShape} = this.world.peek(x|0, y|0)
			y = this.y + this.head - y; x = this.x - x
			a: if(solid){
				if(blockShape){
					if(!blockShape.length) break a
					for(let i = 0; i < blockShape.length; i++)
						if(blockShape[i] > x | blockShape[i+2] < x | blockShape[i+1] > y | blockShape[i + 3] < y) break a
				}
				this.damage(1, damageTypes.suffocation)
			}
		}
		super.update()
		const dy = this.impactDy * (1 - this.impactSoftness)
		if(abs(dy) > 13){
			const d = max(0,round((dy * dy * 0.022) - 4))
			this.damage(d, d >= 4 ? damageTypes.fall : damageTypes.hitGround)
		}
	}
}

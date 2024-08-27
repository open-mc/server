import { explode } from '../explode.js'
import { Entities, Entity } from '../entity.js'

Entities.end_crystal = class extends Entity{
	static width = 0.99
	static height = 1.99
	static gx = 0
	static gy = 0
	health = 1; power = 180
	static savedata = {power: Short}
	static maxHealth = 1
	damage(a, _){
		if(a < 1) return
		this.event(3)
		explode(this, this.power)
	}
}
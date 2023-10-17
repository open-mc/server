import { GAMERULES, players } from '../../world/index.js'
import { Entities, Entity } from '../entity.js'

Entities.lightning_bolt = class extends Entity{
	static width = 0
	static height = 0
	static gx = 0
	static gy = 0
	update(){
		if(this.age == 1){
			this.event(1)
			if(GAMERULES.globalevents){
				for(const player of players.values()){
					if(player.world != this.world) continue
					const dist = 4 - sqrt((player.x-this.x) * (player.x-this.x) + (player.y-this.y) * (player.y-this.y)) / 40_000
					if(dist < 0) continue
					player.worldEvent(53, buf => buf.float(dist))
				}
			}else{
				for(const {player} of this.chunk.sockets)
					player.worldEvent(53, buf => buf.float(8))
			}
		}
		if(this.age >= 20) this.remove()
	}
}
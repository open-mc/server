import { CONFIG } from "../../config.js"
import { X, Y } from "../../entities/misc/playerentity.js"
import { antChunk, chunkTileIndex, goto, peekdown, peekup } from "../../misc/ant.js"
import { Dimensions } from "../../world/index.js"
import { Block, Blocks } from "../block.js"

Blocks.portal = class extends Block{
	static solid = false
	update(){
		const d = peekdown(), u = peekup()
		if((d != Blocks.obsidian & d != Blocks.portal) | (u != Blocks.obsidian & u != Blocks.portal)){
			this.destroy(true, undefined)
			antChunk.portals.remove(chunkTileIndex)
		}
	}
	touched(e){
		// & 1 == touched portal this tick
		// & 2 == touched portal last tick
		if(e.flags & 3) return void(e.flags |= 1)
		e.flags |= 1
		const dim = e.world == Dimensions.overworld ? Dimensions.nether : Dimensions.overworld
		const targetX = floor(dim == Dimensions.nether ? e.x / CONFIG.netherscale : e.x * CONFIG.netherscale) | 0
		const targetY = floor(dim == Dimensions.nether ? e.y / CONFIG.netherscale : e.y * CONFIG.netherscale) | 0
		const chs = [
			dim.load(targetX - 32 >>> 6, targetY - 32 >>> 6),
			dim.load(targetX + 32 >>> 6, targetY - 32 >>> 6),
			dim.load(targetX - 32 >>> 6, targetY + 32 >>> 6),
			dim.load(targetX + 32 >>> 6, targetY + 32 >>> 6)
		]
		if(chs[0].t<0 | chs[1].t<0 | chs[2].t<0 | chs[3].t<0)
			return void(e.flags &= -2)
		
		// We've loaded all 4 chunks, we need to find a portal, or create one
		let closestDx = 0, closestDy = 0, closestDist = 2e9
		for(const ch of chs){
			for(const p of ch.portals){
				const dx = ifloat((p & 63 | ch.x<<6) - targetX),
						dy = ifloat((p>>6 | ch.y<<6) - targetY),
						dist = dx * dx + dy * dy
				if(dist < closestDist){ closestDist = dist; closestDx = dx; closestDy = dy }
			}
		}
		e.x = targetX + closestDx + 0.5
		e.y = targetY + closestDy
		e.world = dim
		e.rubber?.(X | Y)
		e.event(50)
		if(closestDist < 2e9) return true // Portal exists
		
		// Create a portal
		// we'll just put it at (targetX, targetY) for now
		goto(targetX, targetY - 1, dim)
		place(Blocks.obsidian)
		up(); place(Blocks.portal)
		antChunk.portals.push(chunkTileIndex)
		up(); place(Blocks.portal)
		up(); place(Blocks.portal)
		up(); place(Blocks.obsidian)
		jump(1,-1); place(Blocks.air)
		down(); place(Blocks.air)
		down(); place(Blocks.air)
		jump(-2,0); place(Blocks.air)
		up(); place(Blocks.air)
		up(); place(Blocks.air)

		return true
	}
}


Blocks.end_portal = class extends Block{
	static solid = false

	touched(e){
		if(e.flags & 3) return void(e.flags |= 1)
		e.flags |= 1
		if(e.world != Dimensions.end){
			e.world = Dimensions.end
			e.x = 100.5
			e.y = 1
			e.rubber?.(X | Y)
			if(Dimensions.end.load(1,0).t<0) return void(e.flags&=-2)
			goto(98, 0, Dimensions.end)
			for(let i = 0; i < 5; i++)
				place(Blocks.obsidian), right()
		}else{
			e.world = GAMERULES.spawnWorld
			e.x = GAMERULES.spawnX
			e.y = GAMERULES.spawnY
			e.rubber?.(X | Y)
		}
		return true
	}
}

Blocks.end_portal_frame = class extends Block{
}
Blocks.filled_end_portal_frame = class extends Block{
}
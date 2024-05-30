import { DXDY, X, Y } from '../../entities/entity.js'
import { antChunk, chunkTileIndex, down, getX, getY, goto, jump, load, peek, peekdown, peekup, place, right, save, up } from '../../misc/ant.js'
import { Dimensions, GAMERULES } from '../../world/index.js'
import { Block, Blocks } from '../block.js'

Blocks.portal = class extends Block{
	static solid = false
	static blockShape = [0.375, 0, 0.625, 1]
	static breaktime = Infinity
	static blast = Infinity
	update(){
		const u = peekup(), d = peekdown()
		if((d == Blocks.obsidian | d == Blocks.portal) & (u == Blocks.obsidian | u == Blocks.portal)) return
		place(Blocks.air)
		const s = save()
		{
			let d; down()
			while(d = peek(), d == Blocks.portal)
				d.destroy(), down()
		}
		load(s)
		{
			let d; up()
			while(d = peek(), d == Blocks.portal)
				d.destroy(), up()
		}
	}
	unset(){
		antChunk.portals.remove(chunkTileIndex)
	}
	touched(e){
		// & 1 == touched portal this tick
		// & 2 == touched portal last tick
		if(e.flags&1) return
		e.flags |= 1
		if(--e.portalTimeout > 0) return
		const dim = e.world == Dimensions.nether ? Dimensions.overworld : Dimensions.nether
		while(peekdown() == Blocks.portal) down()
		const targetX = floor(dim == Dimensions.nether ? getX() / CONFIG.world.nether_scale : getX() * CONFIG.world.nether_scale) | 0
		const targetY = floor(dim == Dimensions.nether ? getY() / CONFIG.world.nether_scale : getY() * CONFIG.world.nether_scale) | 0
		const chs = [
			dim.load(targetX - 32 >>> 6, targetY - 32 >>> 6),
			dim.load(targetX + 32 >>> 6, targetY - 32 >>> 6),
			dim.load(targetX - 32 >>> 6, targetY + 32 >>> 6),
			dim.load(targetX + 32 >>> 6, targetY + 32 >>> 6)
		]
		if(chs[0].t<0 | chs[1].t<0 | chs[2].t<0 | chs[3].t<0)
			return void(e.portalTimeout = 1)
		e.portalTimeout = 600
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
		if(e.sock) e.rubber(X | Y)
		e.worldEvent(50)
		if(closestDist < 2e9) return true // Portal exists
		
		// Create a portal
		// we'll just put it at (targetX, targetY) for now
		goto(dim, targetX, targetY - 1)
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
	static blockShape = [0, 0, 1, 0.75]
	static softness = 1
	static breaktime = Infinity
	static blast = Infinity
	touched(e){
		if(e.flags & 3) return void(e.flags |= 1)
		e.flags |= 1
		if(e.world != Dimensions.end){
			if(Dimensions.end.load(1,0).t<0) return void(e.flags&=-2)
			e.worldEvent(50)
			e.world = Dimensions.end
			e.x = 100.5
			e.y = 1
			e.dx = e.dy = 0
			if(e.sock) e.rubber(X | Y | DXDY)
			goto(Dimensions.end, 98, 0)
			for(let i = 0; i < 5; i++)
				place(Blocks.obsidian), right()
			for(let i = 0; i < 3; i++){
				jump(-5,1)
				for(let i = 0; i < 5; i++)
					place(Blocks.air), right()
			}
		}else{
			e.worldEvent(50)
			e.world = Dimensions[GAMERULES.spawnworld] ?? Dimensions.overworld
			e.x = GAMERULES.spawnx
			e.y = GAMERULES.spawny
			if(e.sock) e.rubber(X | Y)
		}
		return true
	}
}

Blocks.end_portal_frame = class extends Block{
	static breaktime = Infinity
	static blast = Infinity
	static blockShape = [0, 0, 1, 13/16]
}
Blocks.filled_end_portal_frame = class extends Blocks.end_portal_frame{
}
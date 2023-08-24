import { CONFIG } from '../config.js'
import { DataWriter } from 'dataproto'

export const ChunkLoader = T => class extends T{
	radius = CONFIG.world.chunkloadingrange
	place(a,b,c){
		super.place(a,b,c)
		this.load(floor(this.x) >> 6, floor(this.y) >> 6, this.world)
	}
	moved(){
		const {world, _world, radius, sock} = this
		if(!_world || !sock) return
		let ocx = floor(this._x) >> 6
		let ocy = floor(this._y) >> 6
		let cx = floor(this.x) >> 6
		let cy = floor(this.y) >> 6
		if(ocx == cx && ocy == cy && _world == world) return
		if(_world != world || max(abs(cx-ocx << 6 >> 6),abs(cy-ocy << 6 >> 6)) > 2 * this.radius - 2){
			//teleport
			this.unload(ocx, ocy, _world)
			this.load(cx, cy, world)
			return
		}
		if(cx>999999&&ocx<-999999)cx-=0x4000000
		if(cx<-999999&&ocx>999999)cx+=0x4000000
		if(cy>999999&&ocy<-999999)cy-=0x4000000
		if(cy<-999999&&ocy>999999)cy+=0x4000000
		let tx = cx + ocx
		let ty = cy + ocy
		let y0 = ocy + radius
		let y1 = cy + radius
		if(y0>y1)[y0, y1] = [y1-radius-radius+1,y0-radius-radius+1]
		let x0 = ocx + radius
		let x1 = cx + radius
		if(x0>x1)[x0, x1] = [x1-radius-radius+1,x0-radius-radius+1]
		let XT = cx + radius
		let YT = min(cy,ocy)+radius
		let trashed = new DataWriter()
		trashed.byte(17)
		for(let y = y0; y < y1; y++){
			for(let x=cx-radius+1;x<XT;x++){
				this.world.link(x, y, sock)
				if(this.world.unlink(tx-x, ty-y, sock)){
					trashed.int(tx-x)
					trashed.int(ty-y)
				}
			}
		}
		for(let x = x0; x < x1; x++){
			for(let y=max(cy,ocy)-radius+1;y<YT;y++){
				this.world.link(x, y, sock)
				if(this.world.unlink(tx-x, ty-y, sock)){
					trashed.int(tx-x)
					trashed.int(ty-y)
				}
			}
		}
		sock.packets.push(trashed.build())
		super.moved?.()
	}
	load(cx, cy, world){
		const {radius, sock} = this
		if(!sock) return
		for(let x=cx-radius+1;x<cx+radius;x++){
			for(let y=cy-radius+1;y<cy+radius;y++){
				world.link(x, y, sock)
			}
		}
	}
	unload(cx, cy, world, send = true){
		const {radius, sock} = this
		if(!sock) return
		if(!send){
			for(let x = cx-radius+1;x<cx+radius;x++){
				for(let y=cy-radius+1;y<cy+radius;y++){
					world.unlink(x, y, sock)
				}
			}
			return
		}
		let area = radius * 2 - 1
		area *= area
		const trashed = new DataWriter()
		trashed.byte(17)
		for(let x = cx-radius+1;x<cx+radius;x++){
			for(let y=cy-radius+1;y<cy+radius;y++){
				if(world.unlink(x, y, this.sock)){
					trashed.int(x)
					trashed.int(y)
				}
			}
		}
		this.sock.packets.push(trashed.build())
	}
	remove(){
		const cx = floor(this.x) >> 6
		const cy = floor(this.y) >> 6
		this.unload(cx, cy, this.world, false)
		super.remove()
	}
}
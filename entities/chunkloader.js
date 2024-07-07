import { DataWriter } from '../modules/dataproto.js'

export const ChunkLoader = T => class extends T{
	radius = max(2, CONFIG.world.chunk_loading_range+1)
	moved(){
		const {world, _world, radius, sock} = this
		if((!_world && !world) || !sock) return
		let ocx = floor(this._x) >> 6
		let ocy = floor(this._y) >> 6
		let cx = floor(this.x) >> 6
		let cy = floor(this.y) >> 6
		if(ocx == cx && ocy == cy && _world == world) return
		if(_world != world || max(abs(cx-ocx << 6 >> 6),abs(cy-ocy << 6 >> 6)) > 2 * radius - 2){
			//teleport
			if(_world) this.unload(ocx, ocy, _world)
			if(world) this.load(cx, cy, world)
			return
		}
		if(cx>999999&ocx<-999999) cx-=0x4000000
		else if(cx<-999999&ocx>999999) cx+=0x4000000
		if(cy>999999&ocy<-999999) cy-=0x4000000
		else if(cy<-999999&ocy>999999) cy+=0x4000000
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
		const trashed = new DataWriter()
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
		sock.send(trashed.build())
		super.moved?.()
	}
	load(cx, cy, world){
		const {radius, sock} = this
		if(!sock) return
		for(let x=cx-radius+1;x<cx+radius;x++)
			for(let y=cy-radius+1;y<cy+radius;y++)
				world.link(x, y, sock)
	}
	unload(cx, cy, world, send = true){
		const {radius, sock} = this
		if(!sock) return
		if(!send){
			for(let x = cx-radius+1;x<cx+radius;x++)
				for(let y=cy-radius+1;y<cy+radius;y++)
					world.unlink(x, y, sock)
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
		this.sock.send(trashed.build())
	}
	remove(){
		const cx = floor(this.x) >> 6
		const cy = floor(this.y) >> 6
		if(this.world) this.unload(cx, cy, this.world, false)
		super.remove()
	}
}
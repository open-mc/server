import { CONFIG } from '../config.js'
import { DropChunk } from '../misc/packet.js'

export const CHUNKLOADER = {
	init(){
		this.radius = CONFIG.chunkloadingrange
		this.load(Math.floor(this.x) >> 6, Math.floor(this.y) >> 6)
	},
	moved(ox, oy, ow){
		let ocx = Math.floor(ox) >> 6
		let ocy = Math.floor(oy) >> 6
		let cx = Math.floor(this.x) >> 6
		let cy = Math.floor(this.y) >> 6
		if(ocx == cx && ocy == cy)return
		if(ow != this.world || Math.max(Math.abs(cx-ocx << 6 >> 6),Math.abs(cy-ocy << 6 >> 6)) > 2 * this.radius - 2){
			//teleport
			const _w = this._w
			this._w = ow
			this.unload(ocx, ocy)
			this._w = _w
			this.load(cx, cy)
			return
		}
		if(cx>99999&&ocx<-99999)cx-=0x4000000
		if(cx<-99999&&ocx>99999)cx+=0x4000000
		if(cy>99999&&ocy<-99999)cy-=0x4000000
		if(cy<-99999&&ocy>99999)cy+=0x4000000
		let tx = cx + ocx
		let ty = cy + ocy
		let y0 = ocy + this.radius
		let y1 = cy + this.radius
		if(y0>y1)[y0, y1] = [y1-this.radius-this.radius+1,y0-this.radius-this.radius+1]
		let x0 = ocx + this.radius
		let x1 = cx + this.radius
		if(x0>x1)[x0, x1] = [x1-this.radius-this.radius+1,x0-this.radius-this.radius+1]
		let XT = cx + this.radius
		let YT = Math.min(cy,ocy)+this.radius
		let trashed = []
		for(let y = y0; y < y1; y++){
			for(let x=cx-this.radius+1;x<XT;x++){
				this.world.load(x, y, this)
				this.world.unlink(tx-x, ty-y, this)
				trashed.push(tx-x)
				trashed.push(ty-y)
				trashed.i += 8
			}
		}
		
		for(let x = x0; x < x1; x++){
			for(let y=Math.max(cy,ocy)-this.radius+1;y<YT;y++){
				this.world.load(x, y, this)
				this.world.unlink(tx-x, ty-y, this)
				trashed.push(tx-x)
				trashed.push(ty-y)
				trashed.i += 8
			}
		}
		DropChunk(this.sock, trashed)
	},
	load(cx, cy){
		for(let x=cx-this.radius+1;x<cx+this.radius;x++){
			for(let y=cy-this.radius+1;y<cy+this.radius;y++){
				this.world.load(x, y, this)
			}
		}
	},
	unload(cx, cy, send = true){
		if(!send){
			for(let x = cx-this.radius+1;x<cx+this.radius;x++){
				for(let y=cy-this.radius+1;y<cy+this.radius;y++){
					this.world.unlink(x, y, this)
				}
			}
			return
		}
		let area = this.radius * 2 - 1
		area *= area
		let trashed = []
		for(let x = cx-this.radius+1;x<cx+this.radius;x++){
			for(let y=cy-this.radius+1;y<cy+this.radius;y++){
				this.world.unlink(x, y, this)
				trashed.push(x)
				trashed.push(y)
				trashed.i += 8
			}
		}
		DropChunk(this.sock, trashed)
	},
	died(){
		let cx = Math.floor(this.x) >> 6
		let cy = Math.floor(this.y) >> 6
		this.chunk && this.chunk.entities.delete(this)
		this.unload(cx, cy, false)
	}
}
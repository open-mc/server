import { CONFIG } from '../config.js'
import { DataWriter } from '../utils/data.js'

export const CHUNKLOADER = {
	init(rad = CONFIG.chunkloadingrange){
		this.radius = rad
		this.load(Math.floor(this.x) >> 6, Math.floor(this.y) >> 6, this._w)
	},
	moved(ox, oy, ow){
		let ocx = Math.floor(ox) >> 6
		let ocy = Math.floor(oy) >> 6
		let cx = Math.floor(this.x) >> 6
		let cy = Math.floor(this.y) >> 6
		if(ocx == cx && ocy == cy)return
		if(ow != this.world || Math.max(Math.abs(cx-ocx << 6 >> 6),Math.abs(cy-ocy << 6 >> 6)) > 2 * this.radius - 2){
			//teleport
			this.unload(ocx, ocy, ow)
			this.load(cx, cy, this._w)
			return
		}
		if(cx>999999&&ocx<-999999)cx-=0x4000000
		if(cx<-999999&&ocx>999999)cx+=0x4000000
		if(cy>999999&&ocy<-999999)cy-=0x4000000
		if(cy<-999999&&ocy>999999)cy+=0x4000000
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
		let trashed = new DataWriter()
		trashed.byte(17)
		for(let y = y0; y < y1; y++){
			for(let x=cx-this.radius+1;x<XT;x++){
				this.world.load(x, y, this)
				this.world.unlink(tx-x, ty-y, this)
				trashed.int(tx-x)
				trashed.int(ty-y)
			}
		}
		
		for(let x = x0; x < x1; x++){
			for(let y=Math.max(cy,ocy)-this.radius+1;y<YT;y++){
				this.world.load(x, y, this)
				this.world.unlink(tx-x, ty-y, this)
				trashed.int(tx-x)
				trashed.int(ty-y)
			}
		}
		trashed.pipe(this.sock)
	},
	load(cx, cy, world){
		for(let x=cx-this.radius+1;x<cx+this.radius;x++){
			for(let y=cy-this.radius+1;y<cy+this.radius;y++){
				world.load(x, y, this)
			}
		}
	},
	unload(cx, cy, world, send = true){
		if(!send){
			for(let x = cx-this.radius+1;x<cx+this.radius;x++){
				for(let y=cy-this.radius+1;y<cy+this.radius;y++){
					world.unlink(x, y, this)
				}
			}
			return
		}
		let area = this.radius * 2 - 1
		area *= area
		const trashed = new DataWriter()
		trashed.byte(17)
		for(let x = cx-this.radius+1;x<cx+this.radius;x++){
			for(let y=cy-this.radius+1;y<cy+this.radius;y++){
				world.unlink(x, y, this)
				trashed.int(x)
				trashed.int(y)
			}
		}
		trashed.pipe(this.sock)
	},
	removed(){
		const cx = Math.floor(this.x) >> 6
		const cy = Math.floor(this.y) >> 6
		this.unload(cx, cy, this.world, false)
	}
}
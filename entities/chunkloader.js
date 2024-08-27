import { DataWriter } from '../modules/dataproto.js'

const babs = n => n<0n?-n:n
export const ChunkLoader = T => class extends T{
	radius = BigInt(max(2, CONFIG.world.chunk_loading_range+1))
	moved(){
		const {world, _world, radius, sock} = this
		if((!_world && !world) || !sock) return
		let ocx = BigInt(floor(this._x)) >> 6n
		let ocy = BigInt(floor(this._y)) >> 6n
		let cx = BigInt(floor(this.x)) >> 6n
		let cy = BigInt(floor(this.y)) >> 6n
		if(ocx == cx && ocy == cy && _world == world) return
		if(_world != world || max(Number(babs(cx-ocx)),Number(babs(cy-ocy))) > 2n * radius - 2n){
			//teleport
			if(_world) this.unload(ocx, ocy, _world)
			if(world) this.load(cx, cy, world)
			return
		}
		let tx = cx + ocx
		let ty = cy + ocy
		let y0 = ocy + radius
		let y1 = cy + radius
		if(y0>y1)[y0, y1] = [y1-radius-radius+1n,y0-radius-radius+1n]
		let x0 = ocx + radius
		let x1 = cx + radius
		if(x0>x1)[x0, x1] = [x1-radius-radius+1n,x0-radius-radius+1n]
		let XT = cx + radius
		let YT = (cy<ocy?cy:ocy)+radius
		const trashed = new DataWriter()
		trashed.byte(17)
		for(let y = y0; y < y1; y++){
			for(let x=cx-radius+1n;x<XT;x++){
				this.world.link(x, y, sock)
				if(this.world.unlink(tx-x, ty-y, sock)){
					trashed.bigint(tx-x)
					trashed.bigint(ty-y)
				}
			}
		}
		for(let x = x0; x < x1; x++){
			for(let y=(cy>ocy?cy:ocy)-radius+1n;y<YT;y++){
				this.world.link(x, y, sock)
				if(this.world.unlink(tx-x, ty-y, sock)){
					trashed.bigint(tx-x)
					trashed.bigint(ty-y)
				}
			}
		}
		sock.send(trashed.build())
		super.moved?.()
	}
	load(cx, cy, world){
		const {radius, sock} = this
		if(!sock) return
		for(let x=cx-radius+1n;x<cx+radius;x++)
			for(let y=cy-radius+1n;y<cy+radius;y++)
				world.link(x, y, sock)
	}
	unload(cx, cy, world, send = true){
		const {radius, sock} = this
		if(!sock) return
		if(!send){
			for(let x = cx-radius+1n;x<cx+radius;x++)
				for(let y=cy-radius+1n;y<cy+radius;y++)
					world.unlink(x, y, sock)
			return
		}
		let area = radius * 2n - 1n
		area *= area
		const trashed = new DataWriter()
		trashed.byte(17)
		for(let x = cx-radius+1n;x<cx+radius;x++){
			for(let y=cy-radius+1n;y<cy+radius;y++){
				if(world.unlink(x, y, this.sock)){
					trashed.bigint(x)
					trashed.bigint(y)
				}
			}
		}
		this.sock.send(trashed.build())
	}
	remove(){
		const cx = BigInt(floor(this.x)) >> 6n
		const cy = BigInt(floor(this.y)) >> 6n
		if(this.world) this.unload(cx, cy, this.world, false)
		super.remove()
	}
}
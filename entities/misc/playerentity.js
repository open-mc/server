import { Item } from '../../items/item.js'
import { DataWriter } from '../../utils/data.js'
import { CHUNKLOADER } from '../chunkloader.js'
import { Entities, Entity } from '../entity.js'

Entities.player = Entity.define({
	...CHUNKLOADER,
	toString(){
		return `\x1b[33m${this.name}\x1b[m \x1b[31m${this.health/2} ♥\x1b[m`
	},
	chat(msg, style = 15){
		this.sock.send((style<16?'0'+style.toString(16):style.toString(16)) + msg)
	},
	rubber(){
		this.r = (this.r + 1) & 0xff
		let buf = new DataWriter()
		buf.byte(4)
		buf.byte(this.r)
		buf.double(this.x)
		buf.double(this.y)
		buf.string(this.world.id)
		buf.float(this.dx)
		buf.float(this.dy)
		buf.float(this.f)
		buf.pipe(this.sock)
	}
}, {
	health: Byte,
	inv: [Item, 41]
})
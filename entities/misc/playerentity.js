import { TPS } from '../../config.js'
import { Item } from '../../items/item.js'
import { DataWriter } from '../../utils/data.js'
import { encodeMove } from '../../world/tick.js'
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
	rubber(mv = 127){
		this.r = (this.r + 1) & 0xff
		let buf = new DataWriter()
		buf.byte(1)
		buf.int(this._id | 0)
		buf.short(this._id / 4294967296 | 0)
		buf.byte(this.r)
		buf.float(TPS)
		this.sock.packets.push(buf)
		if(mv){
			this.mv |= mv
			encodeMove(this, this)
		}
	}
}, {
	health: Byte,
	inv: [Item, 37],
	items: [Item, 6],
	selected: Byte,
	skin: Uint8Array
})
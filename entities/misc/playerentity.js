import { Blocks } from '../../blocks/block.js'
import { stat } from '../../config.js'
import { Item } from '../../items/item.js'
import { blockevent, cancelgridevent, goto, peek, place } from '../../misc/ant.js'
import { DataWriter } from '../../utils/data.js'
import { current_tps, encodeMove } from '../../world/tick.js'
import { ChunkLoader } from '../chunkloader.js'
import { Entities } from '../entity.js'
import { PNG } from 'pngjs'

Entities.player = class Player extends ChunkLoader{
	inv = Array.null(36)
	items = [null, null, null, null, null, null]
	health = 20
	selected = 0
	skin = null
	sock = null
	breakGridEvent = 0
	blockBreakLeft = -1
	bx = 0; by = 0
	static width = 0.3
	get height(){return this.state & 2 ? 1.5 : 1.8}
	get head(){return this.state & 2 ? 1.4 : 1.6}
	toString(){
		return `\x1b[33m${this.name}\x1b[m \x1b[31m${this.health/2} ♥\x1b[m`
	}
	chat(msg, style = 15){
		this.sock.send((style<16?'0'+style.toString(16):style.toString(16)) + msg)
	}
	rubber(mv = 127){
		this.sock.r = (this.sock.r + 1) & 0xff
		let buf = new DataWriter()
		buf.byte(1)
		buf.int(this._id | 0)
		buf.short(this._id / 4294967296 | 0)
		buf.byte(this.sock.r)
		buf.float(current_tps)
		this.sock.packets.push(buf)
		if(mv){
			const mv2 = this.mv
			this.mv = mv
			encodeMove(this, this)
			this.mv = mv2
		}
	}
	tick(){
		if(this.blockBreakLeft >= 0){
			this.blockBreakLeft--
			if(this.blockBreakLeft == 0){
				goto(this.bx, this.by, this.world)
				const drop = peek().drops?.(this.inv[this.selected])
				if(drop instanceof Item){
					const itm = Entities.item(this.bx + 0.5, this.by + 0.375)
					itm.item = drop
					itm.dx = random() * 6 - 3
					itm.dy = 6
					itm.place(this.world)
				}else if(drop instanceof Array){
					for(const d of drop){
						const itm = Entities.item(this.bx + 0.5, this.by + 0.375)
						itm.item = d
						itm.dx = random() * 6 - 3
						itm.dy = 6
						itm.place(this.world)
					}
				}
				blockevent(2)
				place(Blocks.air)
				stat('player', 'blocks_broken')
				cancelgridevent(this.breakGridEvent)
				this.breakGridEvent = 0
				this.blockBreakLeft = -1
			}
		}
	}
	static savedata = {
		health: Byte,
		inv: [Item, 36],
		items: [Item, 6],
		selected: Byte,
		skin: Uint8Array
	}
	_avatar = null
	//todo: 64x64 size instead of 12x12
	getAvatar(){
		if(this._avatar) return this._avatar
		const png = new PNG({width: 64, height: 64})
		src = this.skin; dest = new Uint32Array(png.data.buffer)
		// draw shoulder at x=22, y=49 (to x=42, y=64)
		c3t4_5(3158, 4); c3t4_5(3163, 5); c3t4_5(3168, 6); c3t4_5(3173, 7)
		c3t4_5(3478,32); c3t4_5(3483,33); c3t4_5(3488,34); c3t4_5(3493,35)
		c3t4_5(3798,60); c3t4_5(3803,61); c3t4_5(3808,62); c3t4_5(3813,63)
		// draw head at x=12, y=9
		for(let i = 0; i < 64; i++)
			c3t4_5(588 + (i&7)*5 + (i>>3)*320, 132 + (i&7) + (i>>3)*28)
		// Free echo back service because discord is dumb and doesn't allow data avatar urls
		return this._avatar = PNG.sync.write(png)
	}
	getName(){ return this.name }
	damage(){}
}
let src, dest
// Function for copying 3 bytes from an rgb u8 image buffer to a 5x5 area in an rgba u32 image buffer
const c3t4_5 = new Uint8Array(Uint16Array.of(1).buffer)[0] === 1
? (p, o) => {
	dest[p    ] = dest[p + 1] = dest[p + 2] = dest[p + 3] = dest[p + 4] =
	dest[p +64] = dest[p +65] = dest[p +66] = dest[p +67] = dest[p +68] =
	dest[p+128] = dest[p+129] = dest[p+130] = dest[p+131] = dest[p+132] =
	dest[p+192] = dest[p+193] = dest[p+194] = dest[p+195] = dest[p+196] =
	dest[p+256] = dest[p+257] = dest[p+258] = dest[p+259] = dest[p+260] =
		src[o*=3] | src[o+1] << 8 | src[o+2] << 16 | 0xFF000000
}
: (p, o) => {
	dest[p    ] = dest[p + 1] = dest[p + 2] = dest[p + 3] = dest[p + 4] =
	dest[p +64] = dest[p +65] = dest[p +66] = dest[p +67] = dest[p +68] =
	dest[p+128] = dest[p+129] = dest[p+130] = dest[p+131] = dest[p+132] =
	dest[p+192] = dest[p+193] = dest[p+194] = dest[p+195] = dest[p+196] =
	dest[p+256] = dest[p+257] = dest[p+258] = dest[p+259] = dest[p+260] =
		src[o*=3] << 16 | src[o+1] << 8 | src[o+2] | 255
}
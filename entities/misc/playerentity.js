import { Blocks } from '../../blocks/block.js'
import { TPS } from '../../config.js'
import { Item } from '../../items/item.js'
import { blockevent, cancelblockevent, goto, peek, place } from '../../misc/ant.js'
import { DataWriter } from '../../utils/data.js'
import { encodeMove } from '../../world/tick.js'
import { ChunkLoader } from '../chunkloader.js'
import { Entities } from '../entity.js'

Entities.player = class Player extends ChunkLoader{
	inv = Array.null(37)
	items = [null, null, null, null, null, null]
	health = 20
	selected = 0
	skin = null
	sock = null
	blockBreakEvent = 0
	blockBreakProgress = -1
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
		buf.float(TPS)
		this.sock.packets.push(buf)
		if(mv){
			this.mv |= mv
			encodeMove(this, this)
		}
	}
	tick(){
		if(this.blockBreakProgress < 0) return
		this.blockBreakProgress++
		const block = this.world.at(this.bx, this.by) || Blocks.air
		const item = this.inv[this.selected]
		if(this.blockBreakProgress >= (item ? item.breaktime(block) : block.breaktime) * TPS){
			goto(this.bx, this.by, this.world)
			const drop = peek().drops(this.inv[this.selected])
			if(drop instanceof Item){
				const itm = Entities.item(this.bx + 0.5, this.by + 0.375)
				itm.item = drop
				itm.dx = random() * 6 - 3
				itm.dy = 6
				itm.place(this.world)
			}else if(drop instanceof Array){
				for(const d of drop){
					const itm = Entities.itm(this.bx + 0.5, this.by + 0.375)
					itm.item = d
					itm.dx = random() * 6 - 3
					itm.dy = 6
					itm.place(this.world)
				}
			}
			blockevent(2)
			place(Blocks.air)
			cancelblockevent(this.blockBreakEvent)
			this.blockBreakEvent = 0
			this.blockBreakProgress = -1
		}
	}
	static savedata = {
		health: Byte,
		inv: [Item, 37],
		items: [Item, 6],
		selected: Byte,
		skin: Uint8Array
	}
}
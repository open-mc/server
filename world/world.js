import { DB, stat, CONFIG } from '../config.js'
import { Chunk } from './chunk.js'
import { generator } from './gendelegator.js'
import { DataWriter } from 'dataproto'
import { entityMap } from './tick.js'
import { argv } from '../internals.js'

export class World extends Map{
	constructor(id){
		super()
		this.id = id
		this.gx = 0
		this.gy = -32
		this.tick = 0

		const [a, b] = CONFIG.generators[this.id].split('/', 2)
		if(!b) this.gend = this.id, this.genn = a
		else this.gend = a, this.genn = b
	}
	load(cx, cy){
		let k = (cx&0x3FFFFFF)+(cy&0x3FFFFFF)*0x4000000
		let ch = super.get(k)
		if(!ch){
			super.set(k, ch = new Chunk(cx, cy, this))
			DB.LOADFILE('dimensions/'+this.id+'/'+k).catch(() => generator(cx,cy,this.gend,this.genn)).then(buf => {
				// Corresponding unstat in gendelegator.js
				stat('world', 'chunk_revisits')
				if(!super.has(k)) return
				ch.t = 20
				try{ch.parse(buf)}catch(e){if(argv.log)console.warn(e)}
				buf = Chunk.diskBufToPacket(buf, cx, cy)
				for(const sock of ch.sockets)
					sock.send(buf)
			})
		}else if(ch.t > -1) ch.t = 20
		return ch
	}
	link(cx, cy, sock){
		let k = (cx&0x3FFFFFF)+(cy&0x3FFFFFF)*0x4000000
		let ch = super.get(k)
		if(!ch){
			super.set(k, ch = new Chunk(cx, cy, this))
			DB.LOADFILE('dimensions/'+this.id+'/'+k).catch(() => generator(cx,cy,this.gend,this.genn)).then(buf => {
				// Corresponding unstat in gendelegator.js
				stat('world', 'chunk_revisits')
				if(!super.has(k)) return
				ch.t = 20
				try{ch.parse(buf)}catch(e){if(argv.log)console.warn(e)}
				buf = Chunk.diskBufToPacket(buf, cx, cy)
				for(const sock of ch.sockets)
					sock.send(buf)
			})
		}else sock.send(ch.toBuf(new DataWriter, true).build())
		ch.sockets.push(sock)
	}
	unlink(cx, cy, sock){
		let ch = super.get((cx&0x3FFFFFF)+(cy&0x3FFFFFF)*0x4000000)
		if(!ch) return false
		ch.sockets.remove(sock)
		const {ebuf} = sock
		for(let e of ch.entities){
			if(e.sock == sock) continue
			ebuf.byte(0), ebuf.uint32(e.netId | 0), ebuf.uint16(e.netId / 4294967296 | 0)
		}
		return true
	}
	check(ch){
		//Timer so that chunk unloads after 20 ticks of no players being in it, but may "cancel" unloading if players go back in during unloading process
		if(ch.sockets.length){
			if(ch.t <= 0) ch.t = -1 //-1 == chunk has had a player loading it and the chunk will need saving again
			else ch.t = 20, ch.tick() //Reset the timer
			return
		}
		if(ch.t <= 0) return
		if(--ch.t) return //Count down timer
		let k = ch.x+ch.y*0x4000000
		const b = ch.toBuf(new DataWriter).build()
		DB.SAVEFILE('dimensions/'+this.id+'/'+k, b).then(() => {
			if(ch.t == -1) return void(ch.t = 5) //If player has been in chunk, re-save chunk in 5 ticks
			super.delete(k) //Completely unloaded with no re-loads, delete chunk
			for(const e of ch.entities) if(!e.sock) entityMap.delete(e.netId)
		})
	}
	save(ch){
		if(ch instanceof Promise) return
		//Save a chunk to disk, but don't unload it
		if(ch.t <= 0) return //Already saving
		ch.t = 0 //Whoops, chunk timer "ended"
		let k = ch.x+ch.y*0x4000000
		const b = ch.toBuf(new DataWriter).build()
		DB.SAVEFILE('dimensions/'+this.id+'/'+k, b).then(() => ch.t = 20) //Once saved, set timer back so it doesn't unload
	}
	peek(x, y, sock = null){
		let ch = super.get((x>>>6)+(y>>>6)*0x4000000)
		if(!ch || ch instanceof Promise) return null
		if(sock && !ch.sockets.includes(sock)) return null
		return ch.tiles[(x & 63) + ((y & 63) << 6)]
	}
	chunk(x, y){ return super.get((x&0x3FFFFFF)+(y&0x3FFFFFF)*0x4000000) }
	put(x, y, b){
		let ch = super.get((x>>>6)+(y>>>6)*0x4000000)
		if(!ch) return
		ch.tiles[(x & 63) + ((y & 63) << 6)] = b
		let buf = new DataWriter()
		buf.byte(8)
		buf.int(x)
		buf.int(y)
		buf.short(b.id)
		for(const sock of ch.sockets)
			sock.send(buf.build())
	}
	[Symbol.for('nodejs.util.inspect.custom')](){return 'Dimensions.'+this.id+' { tick: \x1b[33m'+this.tick+'\x1b[m, chunks: '+(this.size?'(\x1b[33m'+this.size+'\x1b[m) [ ... ]':'[]')+' }'}
	static savedatahistory = []
	toString(){return this.id}

	static savedata = {tick: Double}
}
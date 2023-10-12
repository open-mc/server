import { stat } from './index.js'
import { Chunk } from './chunk.js'
import { generator } from './gendelegator.js'
import { DataWriter } from '../modules/dataproto.js'
import { entityMap } from './tick.js'
import { Dimensions } from './index.js'
import { BlockIDs, Blocks } from '../blocks/block.js'
import { _invalidateCache, antWorld } from '../misc/ant.js'

const dimLevel = DB.sublevel('dimensions')

export class World extends Map{
	constructor(id){
		super()
		this.id = id
		this.gx = 0
		this.gy = -32
		this.tick = 0
		this.level = dimLevel.sublevel(id, {valueEncoding: 'binary'})
		const [a, b] = (CONFIG.generators[this.id]??'default').split('/', 2)
		if(!b) this.gend = this.id, this.genn = a
		else this.gend = a, this.genn = b
	}
	static new(id){ return Dimensions[id] ??= new World(id) }
	_loaded(ch){
		const {x: cx, y: cy} = ch
		ch.loadedAround |= 0x100
		const
			l = super.get((cx-1&0x3FFFFFF)+(cy&0x3FFFFFF)*0x4000000),
			r = super.get((cx+1&0x3FFFFFF)+(cy&0x3FFFFFF)*0x4000000),
			u = super.get((cx&0x3FFFFFF)+(cy+1&0x3FFFFFF)*0x4000000),
			d = super.get((cx&0x3FFFFFF)+(cy-1&0x3FFFFFF)*0x4000000),
			ul = super.get((cx-1&0x3FFFFFF)+(cy+1&0x3FFFFFF)*0x4000000),
			ur = super.get((cx+1&0x3FFFFFF)+(cy+1&0x3FFFFFF)*0x4000000),
			dl = super.get((cx-1&0x3FFFFFF)+(cy-1&0x3FFFFFF)*0x4000000),
			dr = super.get((cx+1&0x3FFFFFF)+(cy-1&0x3FFFFFF)*0x4000000)
		if(u?.loadedAround&0x100) ch.loadedAround |= 1, u.loadedAround |= 16
		if(ur?.loadedAround&0x100) ch.loadedAround |= 2, ur.loadedAround |= 32
		if(r?.loadedAround&0x100) ch.loadedAround |= 4, r.loadedAround |= 64
		if(dr?.loadedAround&0x100) ch.loadedAround |= 8, dr.loadedAround |= 128
		if(d?.loadedAround&0x100) ch.loadedAround |= 16, d.loadedAround |= 1
		if(dl?.loadedAround&0x100) ch.loadedAround |= 32, dl.loadedAround |= 2
		if(l?.loadedAround&0x100) ch.loadedAround |= 64, l.loadedAround |= 4
		if(ul?.loadedAround&0x100) ch.loadedAround |= 128, ul.loadedAround |= 8
	}
	load(cx, cy){
		let k = (cx&0x3FFFFFF)+(cy&0x3FFFFFF)*0x4000000
		let ch = super.get(k)
		if(!ch){
			ch = new Chunk(cx, cy, this)
			super.set((cx&0x3FFFFFF)+(cy&0x3FFFFFF)*0x4000000, ch)
			this.level.get(''+k).catch(() => generator(cx,cy,this.gend,this.genn)).then(buf => {
				buf = new DataReader(buf)
				// Corresponding unstat in gendelegator.js
				stat('world', 'chunk_revisits')
				if(!super.has(k)) return
				ch.t = 20
				try{ch.parse(buf)}catch(e){if(CONFIG.log)console.warn(e)}
				buf = Chunk.diskBufToPacket(buf, cx, cy)
				this._loaded(ch)
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
			ch = new Chunk(cx, cy, this)
			super.set((cx&0x3FFFFFF)+(cy&0x3FFFFFF)*0x4000000, ch)
			this.level.get(''+k).catch(() => generator(cx,cy,this.gend,this.genn)).then(buf => {
				buf = new DataReader(buf)
				// Corresponding unstat in gendelegator.js
				stat('world', 'chunk_revisits')
				if(!super.has(k)) return
				ch.t = 20
				try{ch.parse(buf)}catch(e){if(CONFIG.log)console.warn(e)}
				buf = Chunk.diskBufToPacket(buf, cx, cy)
				this._loaded(ch)
				for(const sock of ch.sockets)
					sock.send(buf)
			})
		}else sock.send(ch.toBuf(new DataWriter(), true).build())
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
		const b = ch.toBuf(new DataWriter()).build()
		this.level.put(''+k, b).then(() => {
			if(ch.t == -1) return void(ch.t = 5) //If player has been in chunk, re-save chunk in 5 ticks
			super.delete(k) //Completely unloaded with no re-loads, delete chunk
			if(antWorld == this) _invalidateCache(ch.x, ch.y)
			let c = super.get((ch.x-1&0x3FFFFFF)+ch.y*0x4000000)
			if(c?.loadedAround&0x100) c.loadedAround &= ~4
			c = super.get((ch.x+1&0x3FFFFFF)+ch.y*0x4000000)
			if(c?.loadedAround&0x100) c.loadedAround &= ~64
			c = super.get(ch.x+(ch.y+1&0x3FFFFFF)*0x4000000)
			if(c?.loadedAround&0x100) c.loadedAround &= ~16
			c = super.get(ch.x+(ch.y-1&0x3FFFFFF)*0x4000000)
			if(c?.loadedAround&0x100) c.loadedAround &= ~1
			c = super.get((ch.x-1&0x3FFFFFF)+(ch.y+1&0x3FFFFFF)*0x4000000)
			if(c?.loadedAround&0x100) c.loadedAround &= ~8
			c = super.get((ch.x+1&0x3FFFFFF)+(ch.y+1&0x3FFFFFF)*0x4000000)
			if(c?.loadedAround&0x100) c.loadedAround &= ~32
			c = super.get((ch.x-1&0x3FFFFFF)+(ch.y-1&0x3FFFFFF)*0x4000000)
			if(c?.loadedAround&0x100) c.loadedAround &= ~2
			c = super.get((ch.x+1&0x3FFFFFF)+(ch.y-1&0x3FFFFFF)*0x4000000)
			if(c?.loadedAround&0x100) c.loadedAround &= ~128

			for(const e of ch.entities) if(!e.sock) entityMap.delete(e.netId)
		})
	}
	save(ch){
		if(ch instanceof Promise) return
		//Save a chunk to disk, but don't unload it
		if(ch.t <= 0) return //Already saving
		ch.t = 0 //Whoops, chunk timer "ended"
		let k = ch.x+ch.y*0x4000000
		const b = ch.toBuf(new DataWriter()).build()
		this.level.put(''+k, b).then(() => ch.t = 20) //Once saved, set timer back so it doesn't unload
	}
	peek(x, y, sock = null){
		let ch = super.get((x>>>6)+(y>>>6)*0x4000000)
		if(!ch || ch instanceof Promise) return Blocks.air
		if(sock && !ch.sockets.includes(sock)) return Blocks.air
		const i = (x & 63) + ((y & 63) << 6)
		return ch[i] == 65535 ? ch.tileData.get(i) : BlockIDs[ch[i]]
	}
	chunk(x, y){ return super.get((x&0x3FFFFFF)+(y&0x3FFFFFF)*0x4000000) }
	put(x, y, b){
		let ch = super.get((x>>>6)+(y>>>6)*0x4000000)
		if(!ch) return
		const i = (x & 63) + ((y & 63) << 6)
		if(b.savedata){
			ch.tileData.set(i, b)
			ch[i] = 65535
		}else{
			ch.tileData.delete(i)
			ch[i] = b
		}
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

World.new('overworld')
World.new('nether')
World.new('end')
World.new('void')

const dimCreate = []
for(let i in Dimensions){
	let d = Dimensions[i]
	dimCreate.push(d.level.get('meta').then(a => {
		const buf = new DataReader(a)
		return buf.read(d.constructor.savedatahistory[buf.flint()] || d.constructor.savedata, d)
	}).catch(e => null))
}
await Promise.all(dimCreate)
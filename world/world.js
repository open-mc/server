import { players, stat } from './index.js'
import { Chunk } from './chunk.js'
import { generator } from './gendelegator.js'
import { DataWriter } from '../modules/dataproto.js'
import { currentTPS, entityMap } from './tick.js'
import { Dimensions } from './index.js'
import { BlockIDs } from '../blocks/block.js'

const dimLevel = DB.sublevel('dimensions')

export class World extends Map{
	constructor(id, type = 0, u = null){
		super()
		this.type = type
		this.id = id
		this.gx = 0
		this.gy = -32
		this.tick = 0
		this.level = dimLevel.sublevel(id, {valueEncoding: 'binary'})
		this.pinned = new Set
		const {0:a,1:b} = (CONFIG.generators[this.id]??'default').split('/', 2)
		if(!b) this.gend = this.id, this.genn = a
		else this.gend = a, this.genn = b
		this.update = u
	}
	static new(id, type = 0, u){ return Dimensions[id] ??= new this(id, type, u) }
	_loaded(ch){
		ch.t = 20
		stat('world', 'chunk_revisits')
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
		let expU = null, expD = null
		if(u?.loadedAround&0x100) expU = u.exposure, ch.loadedAround |= 1, u.loadedAround |= 16,ch.up=u,u.down=ch
		if(ur?.loadedAround&0x100) ch.loadedAround |= 2, ur.loadedAround |= 32
		if(r?.loadedAround&0x100) ch.loadedAround |= 4, r.loadedAround |= 64,ch.right=r,r.left=ch
		if(dr?.loadedAround&0x100) ch.loadedAround |= 8, dr.loadedAround |= 128
		if(d?.loadedAround&0x100) expD = d.exposure, ch.loadedAround |= 16, d.loadedAround |= 1,ch.down=d,d.up=ch
		if(dl?.loadedAround&0x100) ch.loadedAround |= 32, dl.loadedAround |= 2
		if(l?.loadedAround&0x100) ch.loadedAround |= 64, l.loadedAround |= 4,ch.left=l,l.right=ch
		if(ul?.loadedAround&0x100) ch.loadedAround |= 128, ul.loadedAround |= 8
		if(expU){
			let ty = cy+1<<6
			for(let i = 0; i < 64; i++) if(expU[i]==ty){
				let y=64
				while(--y>=0){ const j=i|y<<6,b=ch[j]; if((b==65535?b.tileData.get(j):BlockIDs[b]).solid) break }
				expU[i] = y+ty-63|0
			}
			ty = ty-64|0
			if(expD){
				for(let i = 0; i < 64; i++) if(expU[i]==ty) expU[i]=expD[i]
				let c = d
				while(c){c.exposure=expU;c=c.down}
			}
			ch.exposure = expU
		}else if(expD){
			const ty = cy<<6|1
			for(let i = 0; i < 64; i++){
				let y=64
				while(--y>=0){ const j=i|y<<6,b=ch[j]; if((b==65535?ch.tileData.get(j):BlockIDs[b]).solid){ expD[i] = y+ty|0; break } }
			}
			ch.exposure = expD
		}else ch.exposure = new Int32Array(64).fill(cy+1<<6)
	}
	load(cx, cy){
		const k = (cx&0x3FFFFFF)+(cy&0x3FFFFFF)*0x4000000
		let ch = super.get(k)
		if(!ch){
			ch = new Chunk(cx, cy, this)
			super.set(k, ch)
			this.level.get(''+k).catch(() => generator(cx,cy,this.gend,this.genn)).then(buf => {
				buf = new DataReader(buf)
				// Corresponding unstat in gendelegator.js
				if(!super.has(k)) return
				try{ch.parse(buf)}catch(e){if(CONFIG.log) console.warn(e)}
				buf = Chunk.diskBufToPacket(buf, cx, cy)
				this._loaded(ch)
				for(const sock of ch.sockets){
					sock.send(buf)
					const {ebuf} = sock
					for(const e of ch.entities)
						ebuf.byte(0), ebuf.uint32(e.netId | 0), ebuf.uint16(e.netId / 4294967296 | 0)
				}
			})
		}else if(ch.t > -1) ch.t = 20
		return ch
	}
	link(cx, cy, sock){
		const k = (cx&0x3FFFFFF)+(cy&0x3FFFFFF)*0x4000000
		let ch = super.get(k)
		if(!ch){
			ch = new Chunk(cx, cy, this)
			super.set(k, ch)
			this.level.get(''+k).catch(() => generator(cx,cy,this.gend,this.genn)).then(buf => {
				buf = new DataReader(buf)
				// Corresponding unstat in gendelegator.js
				if(!super.has(k)) return
				try{ch.parse(buf)}catch(e){if(CONFIG.log) console.warn(e)}
				buf = Chunk.diskBufToPacket(buf, cx, cy)
				this._loaded(ch)
				for(const sock of ch.sockets){
					sock.send(buf)
					const {ebuf} = sock
					for(const e of ch.entities)
						ebuf.byte(0), ebuf.uint32(e.netId | 0), ebuf.uint16(e.netId / 4294967296 | 0)
				}
			})
		}else{
			sock.send(ch.toBuf(new DataWriter(), true).build())
			const {ebuf} = sock
			for(const e of ch.entities)
				ebuf.byte(0), ebuf.uint32(e.netId | 0), ebuf.uint16(e.netId / 4294967296 | 0)
		}
		ch.sockets.push(sock)
	}
	unlink(cx, cy, sock){
		let ch = super.get((cx&0x3FFFFFF)+(cy&0x3FFFFFF)*0x4000000)
		if(!ch) return false
		ch.sockets.remove(sock)
		const {ebuf} = sock
		for(let e of ch.entities)
			ebuf.byte(0), ebuf.uint32(e.netId | 0), ebuf.uint16(e.netId / 4294967296 | 0)
		return true
	}
	check(ch){
		//Timer so that chunk unloads after 20 ticks of no players being in it, but may "cancel" unloading if players go back in during unloading process
		if(ch.sockets.length || (ch.loadedAround&512)){
			if(ch.t <= 0) return ch.t = -1, false //-1 == chunk has had a player loading it and the chunk will need saving again
			else return ch.t = 20, true //Reset the timer
		}
		if(ch.t <= 0 || --ch.t) return false //Count down timer
		const {x: chx, y: chy} = ch, k = chx+chy*0x4000000
		const b = ch.toBuf(new DataWriter()).build()
		this.level.put(''+k, b).then(() => {
			if(ch.t == -1) return void(ch.t = 5) //If player has been in chunk, re-save chunk in 5 ticks
			super.delete(k) //Completely unloaded with no re-loads, delete chunk
			let c = super.get((chx-1&0x3FFFFFF)+chy*0x4000000)
			if(c) c.loadedAround &= ~4, c.right=null
			c = super.get((chx+1&0x3FFFFFF)+chy*0x4000000)
			if(c) c.loadedAround &= ~64, c.left=null
			c = super.get((chx-1&0x3FFFFFF)+(chy+1&0x3FFFFFF)*0x4000000)
			if(c) c.loadedAround &= ~8
			c = super.get((chx+1&0x3FFFFFF)+(chy+1&0x3FFFFFF)*0x4000000)
			if(c) c.loadedAround &= ~32
			c = super.get((chx-1&0x3FFFFFF)+(chy-1&0x3FFFFFF)*0x4000000)
			if(c) c.loadedAround &= ~2
			c = super.get((chx+1&0x3FFFFFF)+(chy-1&0x3FFFFFF)*0x4000000)
			if(c) c.loadedAround &= ~128
			let u = super.get(chx+(chy+1&0x3FFFFFF)*0x4000000)
			if(u) u.loadedAround &= ~16, u.down=null
			c = super.get(chx+(chy-1&0x3FFFFFF)*0x4000000)
			if(c){
				c.loadedAround &= ~1, c.up=null
				const exp = c.exposure, y = chy<<6
				if(u){
					const expU = new Int32Array(64)
					while(u){u.exposure=expU;u=u.up}
					for(let i = 0; i < 64; i++){
						const v = exp[i]
						expU[i] = (v-y|0)>=64 ? v : y+64|0
					}
				}
				for(let i = 0; i < 64; i++){
					if((exp[i]-y|0)>0){
						let y2 = y-1|0, c2 = c
						while(c2){
							const j=i|y2<<6&4032,b=c2[j]
							if((b==65535?c2.tileData.get(j):BlockIDs[b]).solid) break
							if(!(--y2&63)) c2 = c2.down
						}
						exp[i] = y2+1|0
					}
				}
			}else{
				const y = chy+1<<6, exp = ch.exposure
				for(let i = 0; i < 64; i++) if((exp[i]>>>6)==chy) exp[i] = y
			}
			for(const e of ch.entities) if(!e.sock) entityMap.delete(e.netId)
		})
		return false
	}
	save(ch){
		//Save a chunk to disk, but don't unload it
		if(ch.t <= 0) return //Already saving
		ch.t = 0 //Whoops, chunk timer "ended"
		let k = ch.x+ch.y*0x4000000
		const b = ch.toBuf(new DataWriter()).build()
		this.level.put(''+k, b).then(() => ch.t = 20) //Once saved, set timer back so it doesn't unload
	}
	pin(cx, cy){
		const ch = cx instanceof Chunk ? cx : this.load(cx, cy)
		if(ch.loadedAround&512) return false
		this.pinned.add(ch)
		ch.loadedAround |= 512
		return true
	}
	unpin(cx, cy){
		const ch = cx instanceof Chunk ? cx : super.get((cx&0x3FFFFFF)+(cy&0x3FFFFFF)*0x4000000)
		if(!ch || !(ch.loadedAround&512)) return false
		this.pinned.delete(ch)
		ch.loadedAround &= ~512
		return true
	}
	chunk(x, y){ return super.get((x&0x3FFFFFF)+(y&0x3FFFFFF)*0x4000000) }
	[Symbol.for('nodejs.util.inspect.custom')](){return 'Dimensions.'+this.id+' { tick: \x1b[33m'+this.tick+'\x1b[m, chunks: '+(this.size?'(\x1b[33m'+this.size+'\x1b[m) [ ... ]':'[]')+' }'}
	static savedatahistory = []
	toString(){return this.id}

	static savedata = {tick: Double, weather: Uint32}

	weather = 0

	event(ev, fn){
		const buf = new DataWriter()
		buf.byte(19)
		buf.byte(ev)
		fn?.(buf)
		buf.byte(0)
		const b = buf.build()
		for(const p of players.values()){
			if(p.world !== this) continue
			p.sock.send(b)
		}
	}
}

World.new('overworld', 0, function(){
	// Runs every tick
	if(this.weather&0x0FFFFFFF) this.weather--
	else this.weather = 0
	if(!this.weather && random() < .000005){
		this.weather = min(0x0FFFFFFF, (600 + floor(random() * 600)) * currentTPS)
		this.event(10, buf => buf.uint32(this.weather))
	}else if(this.weather && this.weather < 0x10000000 && random() < .00001){
		this.weather = 0x10000000 + min(0x0FFFFFFF, this.weather + 600*currentTPS)
		this.event(10, buf => buf.uint32(this.weather))
	}
})
World.new('nether', 1)
World.new('end', 2)
World.new('void', 3)

const dimCreate = []
for(let i in Dimensions){
	let d = Dimensions[i]
	dimCreate.push(d.level.get('meta').then(a => {
		const buf = new DataReader(a)
		buf.read(d.constructor.savedatahistory[buf.flint()] || d.constructor.savedata, d)
		if(!buf.left) return
		let s = buf.flint()
		while(s--) d.pin(buf.int32(), buf.int32())
	}).catch(e => null))
}
await Promise.all(dimCreate)
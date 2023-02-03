import { HANDLERS } from '../config.js'
import { Chunk } from './chunk.js'
import { generator } from './gendelegator.js'
import { Blocks } from '../blocks/block.js'
import { DataWriter } from '../utils/data.js'
export class World extends Map{
	constructor(id){
		super()
		this.id = id
		this.gx = 0
		this.gy = -32
		this.tick = 0
	}
	load(cx, cy, pl = null){
		let k = (cx&67108863)+(cy&67108863)*67108864
		let ch = super.get(k)
		if(ch instanceof Promise){
			if(pl)ch.players.push(pl)
			return ch
		}
		if(ch){
			if(pl){
				ch.players.push(pl)
				if(pl.sock){
					const buf = new DataWriter()
					ch.toBuf(buf)
					for(const e of ch.entities)if(!e.id){
						buf.double(e.x)
						buf.double(e.y)
						buf.int(e._id | 0), buf.short(e._id / 4294967296 | 0)
						buf.string(e.name)
						buf.short(e.state)
						buf.float(e.dx)
						buf.float(e.dy)
						buf.float(e.f)
						buf.write(e._.savedata, e)
					}
					buf.pipe(pl.sock)
				}
			}
			return ch
		}
		let pr = HANDLERS.LOADFILE('dimensions/'+this.id+'/'+k).catch(Function.prototype).then(buf => buf || generator(cx, cy, this.id)).then(buf => {
			let ch = new Chunk(buf, this)
			super.set(k, ch)
			ch.players = pr.players
			for(const pl of ch.players){
				if(Math.floor(pl._x) >> 6 == cx && Math.floor(pl._y) >> 6 == cy && pl._w == this){
					pl.chunk = ch
					ch.entities.add(pl)
					pl.mv = 255
				}
				pl.sock.send(buf)
			}
			ch.t = 20
			return ch
		})
		pr.players = pl ? [pl] : []
		super.set(k, pr)
		return pr
	}
	unlink(cx, cy, pl){
		let ch = super.get((cx&67108863)+(cy&67108863)*67108864)
		if(!ch)return false
		ch.players.remove(pl)
		if(!pl.sock || (ch instanceof Promise))return false
		const buf = pl.ebuf
		for(let e of ch.entities){
			buf.byte(0)
			buf.int(e._id | 0), buf.short(e._id / 4294967296 | 0)
		}
		return true
	}
	check(ch){
		if(ch instanceof Promise)return
		//Timer so that chunk unloads after 20 ticks of no players being in it, but may "cancel" unloading if players go back in during unloading process
		if(ch.players.length){
			if(ch.t <= 0)ch.t = -1 //-1 == chunk has had a player loading it and the chunk will need saving again
			else ch.t = 20 //Reset the timer
			return
		}
		if(ch.t <= 0)return
		if(--ch.t)return //Count down timer
		let k = (ch.x&67108863)+(ch.y&67108863)*67108864
		const b = ch.toBuf(new DataWriter).build()
		HANDLERS.SAVEFILE('dimensions/'+this.id+'/'+k, b).then(() => {
			if(ch.t == -1)ch.t = 5 //If player has been in chunk, re-save chunk in 5 ticks
			else super.delete(k) //Completely unloaded with no re-loads, delete chunk
		})
	}
	save(ch){
		if(ch instanceof Promise)return
		//Save a chunk to disk, but don't unload it
		if(ch.t <= 0)return //Already saving
		ch.t = 0 //Whoops, chunk timer "ended"
		let k = (ch.x&67108863)+(ch.y&67108863)*67108864
		const b = ch.toBuf(new DataWriter).build()
		HANDLERS.SAVEFILE('dimensions/'+this.id+'/'+k, b).then(() => ch.t = 20) //Once saved, set timer back so it doesn't unload
	}
	
	putEntity(e, x, y, force = false){
		let ch = super.get((Math.floor(x)>>>6)+(Math.floor(y)>>>6)*67108864)
		const oldw = e._w
		e._w = this
		if(oldw)e.moved(e._x, e._y, (e._x = x, e._y = y, oldw))
		else e.placed()
		if(e.sock && oldw != this){
			let buf = new DataWriter()
			buf.byte(2)
			buf.string(e.world.id)
			buf.float(this.gx)
			buf.float(this.gy)
			buf.double(this.tick)
			buf.pipe(e.sock)
		}
		if(e.chunk)e.chunk.entities.delete(e)
		if(!ch || ch instanceof Promise){
			if(!force)return false
			e.chunk = null
			if(!ch)ch = this.load(Math.floor(x)>>6, Math.floor(y)>>6)
			ch.then(ch => {
				if(Math.floor(e._x) >> 6 != ch.x || Math.floor(e._y) >> 6 != ch.y || e._w != this)return
				e.chunk = ch
				ch.entities.add(e)
				e.mv = 255
			})
			return true
		}
		ch.entities.add(e)
		e.chunk = ch
		return true
	}
	at(x, y, p = null){
		let ch = super.get((x>>>6)+(y>>>6)*67108864)
		if(!ch || ch instanceof Promise)return null
		if(p && !ch.players.includes(p))return null
		return ch.tiles[(x & 63) + ((y & 63) << 6)]
	}
	get(x, y){ return super.get((x&67108863)+(y&67108863)*67108864) }
	put(x, y, b){
		let ch = super.get((x>>>6)+(y>>>6)*67108864)
		if(!ch)return
		ch.tiles[(x & 63) + ((y & 63) << 6)] = b
		let buf = new DataWriter()
		buf.byte(8)
		buf.int(x)
		buf.int(y)
		buf.short(b.id)
		for(const pl of ch.players){
			buf.pipe(pl.sock)
		}
	}
	[Symbol.for('nodejs.util.inspect.custom')](){return '<World '+this.id+'>'}
	toString(){return this.id}
}
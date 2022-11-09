import { HANDLERS } from '../config.js'
import { Chunk } from './chunk.js'
import { generator } from './gendelegator.js'
import { Blocks } from '../blocks/block.js'
import { BlockSet } from '../misc/packet.js'
import { DataWriter } from '../utils/data.js'
export class World extends Map{
	constructor(id){
		super()
		this.id = id
	}
	load(cx, cy, p = null){
		let k = (cx&67108863)+(cy&67108863)*67108864
		let i = super.get(k)
		if(i instanceof Promise){
			if(p)i.players.push(p)
			return Promise.resolve(i)
		}
		if(i){
			if(p && p.sock){
				i.players.push(p)
				const buf = new DataWriter()
				i.toBuf(buf)
				for(const e of i.entities)if(!e.id && e != p){
					buf.double(e.x)
					buf.double(e.y)
					buf.int(e._id | 0), buf.short(e._id / 4294967296 | 0)
					buf.float(e.dx)
					buf.float(e.dy)
					buf.float(e.f)
					buf.write(e._.savedata, e)
				}
				buf.pipe(p.sock)
			}
			return Promise.resolve(i)
		}
		let pr = HANDLERS.LOADFILE('chunks/'+this.id+'/'+k).catch(Function.prototype).then(buf => buf || generator(cx, cy, this.id)).then(buf => {
			let i = new Chunk(buf, this)
			super.set(k, i)
			i.players = pr.players
			let buf2 = null
			for(const p of i.players){
				if(Math.floor(p._x) >> 6 == cx && Math.floor(p._y) >> 6 == cy){
					p.chunk = p.ochunk = i
					if(!buf2)buf2 = new DataWriter()
					buf2.double(p.x)
					buf2.double(p.y)
					buf2.int(p._id | 0), buf2.short(p._id / 4294967296 | 0)
					buf2.float(p.dx)
					buf2.float(p.dy)
					buf2.float(p.f)
					buf2.write(p._.savedata, p)
					i.entities.add(p)
				}
				if(buf2 && p.sock)p.sock.send(buf,{fin:false}),buf2.pipe(p.sock)
				else p.sock.send(buf)
			}
			i.t = 20
			return i
		})
		pr.players = p ? [p] : []
		super.set(k, pr)
		return pr
	}
	unlink(cx, cy, p){
		let i = super.get((cx&67108863)+(cy&67108863)*67108864)
		if(i)i.players.remove(p)
	}
	async check(i){
		//Timer so that chunk unloads after 20 ticks of no players being in it, but may "cancel" unloading if players go back in during unloading process
		if(i.players.length){
			if(i.t <= 0)i.t = -1 //-1 == chunk has had a player loading it and the chunk will need saving again
			else i.t = 20 //Reset the timer
			return
		}
		if(i.t <= 0)return
		if(--i.t)return //Count down timer
		let k = (i.x&67108863)+(i.y&67108863)*67108864
		const b = i.toBuf(new DataWriter()).build()
		await HANDLERS.SAVEFILE('chunks/'+this.id+'/'+k, b)
		if(i.t == -1)i.t = 5 //If player has been in chunk, re-save chunk in 5 ticks
		else super.delete(k) //Completely unloaded with no re-loads, delete chunk
	}
	putEntity(e, x, y){
		let i = super.get((Math.floor(x)>>>6)+(Math.floor(y)>>>6)*67108864)
		if(!i || (i instanceof Promise))return false
		i.entities.add(e)
		if(e.chunk)e.chunk.entities.delete(e)
		e.chunk = i
		return true
	}
	at(x, y){
		let ch = super.get((x>>>6)+(y>>>6)*67108864)
		if(!ch)return Blocks.air()
		return ch.tiles[(x & 63) + ((y & 63) << 6)]
	}
	put(x, y, b){
		let ch = super.get((x>>>6)+(y>>>6)*67108864)
		if(!ch)return
		ch.tiles[(x & 63) + ((y & 63) << 6)] = b
		blocksetobj.x = x
		blocksetobj.y = y
		blocksetobj.id = b.id
		for(const p of ch.players){
			BlockSet(p.sock, blocksetobj)
		}
	}
	[Symbol.for('nodejs.util.inspect.custom')](){return '<World '+this.id+'>'}
	toString(){return this.id}
}
const blocksetobj = {x: 0, y: 0, id: 0}
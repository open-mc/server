import { HANDLERS } from '../config.js'
import { Chunk } from './chunk.js'
import { generator } from './gendelegator.js'
import { Blocks } from '../blocks/block.js'
import { BlockSet } from '../misc/packet.js'
import { DataWriter } from '../utils/data.js'
const NULL = e => null
export class World extends Map{
	constructor(id){
		super()
		this.id = id
	}
	async fetchonce(cx, cy){
		let k = (cx&=67108863)+(cy&=67108863)*67108864
		let i = super.get(k)
		if(i instanceof Promise){
			return i
		}
		if(i){
			return i
		}
		let pr = HANDLERS.LOADFILE('chunks/'+this.id+'/'+k).catch(NULL).then(buf => buf || generator(cx, cy, this.id)).then(buf => {
			let i = new Chunk(buf)
			super.set(k, i)
			i.players = pr.players
			this.save(cx, cy)
			for(let p of pr.players){
				if(p.sock){
					p.sock.send(buf)
					if(cx == Math.floor(p.x) >>> 6 && cy == Math.floor(p.y) >>> 6){
						i.entities.add(p)
					}
				}
			}
			i.saving = 0
			return i
		})
		pr.players = new Set()
		super.set(k, pr)
		return pr
	}
	load(cx, cy, p){
		let k = (cx&67108863)+(cy&67108863)*67108864
		let i = super.get(k)
		if(i instanceof Promise){
			i.players.add(p)
			return i
		}
		if(i){
			i.players.add(p)
			if(p.sock)i.toPacket(new DataWriter()).pipe(p.sock)
			return i
		}
		let pr = HANDLERS.LOADFILE('chunks/'+this.id+'/'+k).catch(NULL).then(buf => buf || generator(cx, cy, this.id)).then(buf => {
			if(pr.players.size < 1){
				super.delete(k)
				return
			}
			let i = new Chunk(buf)
			super.set(k, i)
			i.players = pr.players
			for(let p of i.players){
				if(p.sock){
					p.sock.send(buf)
					if(cx == Math.floor(p.x / 64) && cy == Math.floor(p.y / 64)){
						i.entities.add(p)
					}
				}
			}
			i.saving = 0
			return i
		})
		pr.players = new Set([p])
		super.set(k, pr)
		return pr
	}
	async save(cx, cy, p){
		let k = (cx&67108863)+(cy&67108863)*67108864
		let i = super.get(k)
		if(!i)return
		i.players.delete(p)
		if(i instanceof Promise)return
		if(!i.players.size){
			if(i.saving){
				i.saving = 2 //needs saving again
				return
			}
			i.saving = 2
			while(i.saving == 2 && !i.players.size){
				i.saving = 1
				const b = i.toPacket(new DataWriter()).build()
				await HANDLERS.SAVEFILE('chunks/'+this.id+'/'+k, b)
			}
			i.saving = 0
			if(!i.players.size)super.delete(k)
		}
	}
	chunk(cx, cy){
		let i = super.get((cx&67108863)+(cy&67108863)*67108864)
		if(!i || (i instanceof Promise))return undefined
		return i
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
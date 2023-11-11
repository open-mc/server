import { Item } from '../items/item.js'
import { DataWriter } from '../modules/dataproto.js'
import { currentTPS, entityMap } from '../world/tick.js'
import { deathMessages } from './deathmessages.js'
import { GAMERULES } from '../world/index.js'
import { Block, BlockIDs, Blocks } from '../blocks/block.js'
import { getX, getY, load, peek, save } from '../misc/ant.js'

export const chatImport = {chat: null}

let i = -1

export const X = 1, Y = 2, DXDY = 4, STATE = 8, NAME = 16, EVENTS = 32, STRUCT = 64

export class Entity{
	constructor(name = ''){
		this._x = this.x = 0
		this._y = this.y = 0
		this._world = this.world = null
		this.dx  = this.dy  = this.f  = 0
		this._dx = this._dy = this._f = 0
		this.impactDx = this.impactDy = 0
		this.impactSoftness = 0
		this.chunk = null
		this._state = this.state = 0
		this.netId = -1
		this.sock = null
		this._name = this.name = name
		this.age = 0
		this.pendingEvents = []
	}
	place(world, x, y){
		this.x = this._x = x = ifloat(x); this.y = this._y = y = ifloat(y)
		if(this.netId < 0){
			this.netId = ++i
			entityMap.set(i, this)
		}
		this.world = world
	}
	/**
	 * define a new entity definition
	 * @param {Object} obj Properties of the entity
	 * @param {Object} [savedata] Entity data format
	 * @return {Function} constructor for that entity
	 */
	[Symbol.for('nodejs.util.inspect.custom')](){
		return `Entities.${this.className} { x: \x1b[33m${this.x.toFixed(2)}\x1b[m, y: \x1b[33m${this.y.toFixed(2)}\x1b[m, world: \x1b[32m${this.world ? 'Dimensions.' + this.world.id : 'null'}\x1b[m${this.name ? `, name: \x1b[32m${JSON.stringify(this.name)}\x1b[m` : ''} }`
	}
	kill(cause){
		if(this.state&0x8000) return
		this.state |= 0x8000
		this.rubber()
		this.died(cause)
		if(this.sock)
			chatImport.chat((deathMessages[cause]??'\0 was killed by an unknown force').replace('\0', this.name))
		else this.remove()
	}
	shouldSimulate(){
		if(!this.world) return false
		const chunk = this.world.get((floor(this.x)>>6&0x3FFFFFF)+(floor(this.y)>>6&0x3FFFFFF)*0x4000000)
		if(!chunk) return false
		if(floor(this.x)>>>5&1)
			if(floor(this.y)>>>5&1) return (chunk.loadedAround&7)==7
			else return (chunk.loadedAround&28)==28
		else
			if(floor(this.y)>>>5&1) return (chunk.loadedAround&112)==112
			else return (chunk.loadedAround&193)==193
	}
	remove(){
		// Don't delete it yet, mark it for deletion
		this.world = null
		this._x = this._y = NaN
	}
	died(){
		if(this.sock ? !GAMERULES.keepinventory : GAMERULES.mobloot){
			const L = this.interfaceList
			if(L) for(const i of L){
				const items = this.interface(i)
				const changed = []
				for(let i = 0; i < items.length; i++){
					if(!items[i]) continue
					const itm = new Entities.item()
					itm.item = items[i]
					itm.dx = random() * 30 - 15
					itm.dy = random() * 4 + 4
					itm.place(this.world, this.x, this.y + this.height / 2)
					items[i] = null
					changed.push(i)
				}
				this.itemschanged(changed, i, items)
			}
		}
	}
	give(stack, i = 0){
		const items = this.interface(i)
		if(!items) return false
		const changed = []
		for(let i = 0; i < items.length; i++){
			const amount = min(stack.count, stack.maxStack)
			if(!items[i]){
				items[i] = new stack.constructor(amount)
				stack.count -= amount
			}else if(items[i].constructor == stack.constructor && !stack.savedata){
				const amount2 = min(amount, items[i].maxStack - items[i].count)
				if(!amount2) continue
				items[i].count += amount2
				stack.count -= amount2
			}else continue
			changed.push(i)
			if(!stack.count) break
		}
		if(!changed.length) return false
		this.itemschanged(changed, 0)
		return true
	}
	giveAndDrop(stack){
		this.give(stack)
		if(stack.count) while(true){
			const e = new Entities.item()
			if(stack.count > 255)
				e.item = stack.constructor(255), stack.count -= 255
			else e.item = stack
			e.place(this.world, this.x, this.y + this.head - 0.5)
			if(e.item == stack) break
		}
	}
	openInterface(e, id = 0){
		if(!this.sock || this.sock.interface) return false
		const res = new DataWriter()
		if(e instanceof Block){
			res.byte(14)
			res.int(getX())
			res.int(getY())
		}else if(e instanceof Entity){
			res.byte(13)
			res.uint32(e.netId); res.short(e.netId / 4294967296 | 0)
		}else throw '.openInterface(<here>, _): Block or entity expected'
		res.byte(this.sock.interfaceId = id&255)
		this.sock.interface = e
		this.sock.interfaceD = e instanceof Block ? save() : e
		this.sock.send(res.build())
		e.interfaceOpened?.()
		return true
	}
	closeInterface(){
		if(!this.sock || !this.sock.interface) return false
		if(!(this.sock.interfaceD instanceof Entity))
			load(this.sock.interfaceD)
		this.sock.interface.interfaceClosed?.()
		this.sock.interface = null
		this.sock.send(Uint8Array.of(15))
		return true
	}
	checkInterface(){
		if(!this.sock.interface) return
		if(this.sock.interfaceD instanceof Entity){
			if(!this.sock.interfaceD.world || (this.sock.interfaceD&0x8000)) return this.closeInterface(), true
		}else{
			load(this.sock.interfaceD)
			if(peek() != this.sock.interface) return this.closeInterface(), true
		}
		return false
	}
	itemschanged(slots, interfaceId = 0, items = this.interface(interfaceId)){
		if(!items||(!this.chunk&&!this.sock)) return
		for(const sock of (this.chunk ? this.chunk.sockets : [this.sock])){
			if(!sock.ibuf) sock.ibuf = new DataWriter(), sock.ibuf.byte(32)
			const {ibuf} = sock
			ibuf.byte(128)
			ibuf.uint32(this.netId); ibuf.short(this.netId/4294967296|0)
			ibuf.byte(interfaceId)
			for(const c of slots){
				ibuf.byte(c)
				Item.encode(ibuf, items[c])
			}
		}
	}
	emit(buf){
		if(this.chunk){
			if(buf instanceof DataWriter)
				for(const sock of this.chunk.sockets) sock.send(buf.build())
			else for(const sock of this.chunk.sockets) sock.send(buf)
		}else if(this.sock){
			if(buf instanceof DataWriter) this.sock.send(buf.build())
			else this.sock.send(buf)
		}
	}
	chat(msg, style = 15){
		this.sock?.send((style<16?'0'+style.toString(16):style.toString(16)) + msg)
	}
	rubber(mv = 63){
		if(!this.sock) return
		this.sock.r = (this.sock.r + 1) & 0xff
		let buf = new DataWriter()
		buf.byte(1)
		buf.int(this.netId | 0)
		buf.short(this.netId / 4294967296 | 0)
		buf.byte(this.sock.r)
		buf.float(currentTPS)
		buf.byte(this.sock.permissions)
		this.sock.packets.push(buf.build())
		this.rubberMv |= mv
	}
	event(id, fn){ this.pendingEvents?.push(id, fn) }
	worldEvent(id, fn){
		if(!this.sock) return
		const buf = new DataWriter()
		buf.flint(15)
		buf.byte(id)
		fn?.(buf)
		buf.byte(0)
		this.sock.send(buf.build())
	}
	static savedata = null
	static maxHealth = 20
	static groundDrag = .0000244
	static airDrag = 0.06
	static yDrag = 0.667
	static width = 0.5; static height = 1; static head = 0.5
	static collisionPaddingX = 0
	static collisionPaddingY = 0
	static gx = 1
	static gy = 1

	flags = 0
	update(){
		this.flags = (this.flags&-4) | (this.flags&1)<<1
	}
	peek(x, y){
		let ch = this.world.get((x>>>6)+(y>>>6)*0x4000000)
		if(!ch || (this.sock && !ch.sockets.includes(this.sock))) return Blocks.air
		const i = (x & 63) + ((y & 63) << 6)
		return ch[i] == 65535 ? ch.tileData.get(i) : BlockIDs[ch[i]]
	}
}

Object.setPrototypeOf(Entity.prototype, null)
export const Entities = Object.create(null)
export const EntityIDs = []
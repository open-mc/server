import { Item } from '../items/item.js'
import { DataWriter } from '../modules/dataproto.js'
import { currentTPS, entityMap } from '../world/tick.js'
import { deathMessages } from './deathmessages.js'
import { GAMERULES } from '../world/index.js'

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
			const changed = []
			if(this.inv) for(let i = 0; i < this.inv.length; i++){
				if(!this.inv[i]) continue
				const itm = new Entities.item()
				itm.item = this.inv[i]
				itm.dx = random() * 30 - 15
				itm.dy = random() * 4 + 4
				itm.place(this.world, this.x, this.y + this.height / 2)
				this.inv[i] = null
				changed.push(i)
			}
			if(this.items) for(let i = 0; i < this.items.length; i++){
				if(!this.items[i]) continue
				const itm = new Entities.item()
				itm.item = this.items[i]
				itm.dx = random() * 30 - 15
				itm.dy = random() * 4 + 4
				itm.place(this.world, this.x, this.y + this.height / 2)
				this.items[i] = null
				changed.push(i | 128)
			}
			this.itemschanged(changed)
		}
	}
	give(stack){
		if(!this.inv) return false
		const changed = []
		for(let i = 0; i < this.inv.length; i++){
			const amount = min(stack.count, stack.maxStack)
			if(!this.inv[i]){
				this.inv[i] = new stack.constructor(amount)
				stack.count -= amount
			}else if(this.inv[i].constructor == stack.constructor && !stack.savedata){
				const amount2 = min(amount, this.inv[i].maxStack - this.inv[i].count)
				if(!amount2) continue
				this.inv[i].count += amount2
				stack.count -= amount2
			}else continue
			changed.push(i)
			if(!stack.count) break
		}
		if(!changed.length) return false
		this.itemschanged(changed)
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
	itemschanged(slots){
		const buf = new DataWriter()
		buf.byte(32)
		buf.uint32(this.netId); buf.short(this.netId / 4294967296)
		for(const c of slots) 
			if(c > 127) buf.byte(c), Item.encode(buf, this.items[c&127])
			else buf.byte(c), Item.encode(buf, this.inv[c])
		if(this.chunk)
			for(const sock of this.chunk.sockets) sock.send(buf.build())
		else if(this.sock) this.sock.send(buf.build())
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
}

Object.setPrototypeOf(Entity.prototype, null)
export const Entities = Object.create(null)
export const EntityIDs = []
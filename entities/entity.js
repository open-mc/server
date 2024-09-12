import { Item } from '../items/item.js'
import { DataWriter } from '../modules/dataproto.js'
import { currentTPS, entityMap, toUnlink } from '../world/tick.js'
import { deathMessages } from './deathmessages.js'
import { GAMERULES } from '../world/index.js'
import { Block, BlockIDs, Blocks } from '../blocks/block.js'
import { getX, getY, load, peek, save } from '../misc/ant.js'
import { EphemeralInterface } from '../misc/ephemeralinterface.js'

export const chatImport = {chat: null}
export const Entities = Object.create(null)
export const X = 1, Y = 2, DXDY = 4, STATE = 8, NAME = 16, EVENTS = 32, STRUCT = 64

let i = -1
export const newId = () => ++i
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
	get chunkX(){return Math.floor(this._x)>>>6}
	get chunkY(){return Math.floor(this._y)>>>6}
	place(world, x, y){
		this.x = this._x = x = ifloat(x); this.y = this._y = y = ifloat(y)
		this.world = world
		if(this.netId < 0){
			if(this.netId == -2) entityMap.set(this.netId = toUnlink.get(this), this), toUnlink.delete(this)
			else entityMap.set(this.netId = ++i, this)
			if(this.sock) this.sock.netId = this.netId, this.rubber()
		}
	}
	unlink(){
		if(this.netId < 0) return
		entityMap.delete(this.netId)
		toUnlink.set(this, this.netId)
		this.netId = -2
	}
	link(){
		if(this.netId >= 0) return
		if(this.netId == -2)
			entityMap.set(this.netId = toUnlink.get(this), this), toUnlink.delete(this)
		else entityMap.set(this.netId = ++i, this)
		if(this.sock) this.sock.netId = this.netId, this.rubber()
	}
	remove(){
		this.world = null
		this._x = this._y = this.x = this.y = 0
		if(this.netId >= 0){
			entityMap.delete(this.netId)
			toUnlink.set(this, this.netId)
			this.netId = -2
		}
	}
	get linked(){ return this.netId >= 0 }
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
		this.died(cause)
		if(this.sock)
			chatImport.chat(cause instanceof Entity ? this.name+' was killed by '+cause.name : (deathMessages[cause]??'\0 was killed by an unknown force').replace('\0', this.name))
		this.unlink()
	}
	died(){
		if(this.sock ? !GAMERULES.keepinventory : GAMERULES.mobloot){
			for(const id of this.allInterfaces??[]){
				this.mapItems(id, itm => {
					if(!itm) return
					const e = new Entities.item()
					e.item = itm
					e.dx = random() * 30 - 15
					e.dy = random() * 4 + 4
					e.place(this.world, this.x, this.y + this.height / 2)
					return null
				})
			}
		}
	}
	give(stack, id = 0){
		this.mapItems(id, itm => {
			if(!stack.count) return
			const count = min(stack.maxStack, stack.count)
			if(!itm) return stack.count -= count, new stack.constructor(count)
			if(itm.constructor == stack.constructor && !itm.savedata){
				const c = min(count, itm.maxStack - itm.count)
				stack.count -= c
				itm.count += c
				return itm
			}
		})
		return stack.count ? stack : null
	}
	giveAndDrop(stack){
		this.give(stack)
		if(stack.count) while(true){
			const e = new Entities.item()
			if(stack.count > 255)
				e.item = stack.constructor(255), stack.count -= 255
			else e.item = stack
			e.dx = this.dx + this.f > 0 ? 7 : -7
			e.place(this.world, this.x, this.y + this.head - 0.5)
			if(e.item == stack) break
		}
	}
	openInterface(e, id = 0, dep = e){
		if(!this.sock || this.sock.interface) return false
		const res = new DataWriter()
		if(e.isBlock){
			res.byte(14)
			res.int(getX())
			res.int(getY())
			res.byte(this.sock.interfaceId = id&255)
		}else if(e instanceof Entity){
			res.byte(13)
			res.uint32(e.netId); res.short(e.netId / 4294967296 | 0)
			res.byte(this.sock.interfaceId = id&255)
		}else if(e instanceof EphemeralInterface){
			res.byte(12)
			res.short(e.constructor.kind??e.kind)
			res.byte(this.sock.interfaceId = id&255)
			e.encode?.(res)
			e.sock = this.sock
		}else throw '.openInterface(<here>, _): Block, entity or ephemeral interface expected'
		this.sock.interface = e
		this.sock.interfaceD = e.isBlock ? save(e) : e instanceof Entity ? e : null
		this.sock.send(res.build())
		e.interfaceOpened?.(id, this)
		return true
	}
	closeInterface(){
		if(!this.sock || !this.sock.interface) return false
		if(this.sock.interfaceD && !(this.sock.interfaceD instanceof Entity))
			load(this.sock.interfaceD)
		this.sock.interface.interfaceClosed?.(this.sock.interfaceId, this)
		if(this.sock.interface instanceof EphemeralInterface) this.sock.interface.sock = null
		this.sock.interface = null
		this.sock.packets.push(Uint8Array.of(15))
		return true
	}
	checkInterface(){
		if(!this.sock.interface) return true
		if(this.sock.interfaceD instanceof Entity){
			if(!this.sock.interfaceD.linked) return this.closeInterface(), true
		}else if(this.sock.interfaceD){
			if(load(this.sock.interfaceD) != peek()) return this.closeInterface(), true
		}
		return false
	}
	getItem(id, slot){}
	setItem(id, slot, item){}
	static slotClicked = EphemeralInterface.prototype.slotClicked
	static slotAltClicked = EphemeralInterface.prototype.slotAltClicked
	static mapItems = EphemeralInterface.prototype.mapItems
	itemChanged(id = 0, slot, item = this.getItem(id, slot)){
		if(!this.chunk){
			const {sock} = this
			if(!sock) return
			let {ibuf, ibufLastB, ibufLastA} = sock
			if(!sock.ibuf) (sock.ibuf = ibuf = new DataWriter()).byte(32)
			if(ibufLastB != this.netId || ibufLastA != id){
				ibuf.byte(131)
				ibuf.byte(id)
				sock.ibufLastA = id
				sock.ibufLastB = Infinity
			}
			ibuf.byte(slot)
			Item.encode(ibuf, item)
			return
		}
		for(const sock of this.chunk.sockets){
			let {ibuf, ibufLastB, ibufLastA} = sock
			if(!sock.ibuf) (sock.ibuf = ibuf = new DataWriter()).byte(32)
			if(ibufLastB != this.netId || ibufLastA != id){
				ibuf.byte(128)
				ibuf.uint32(this.netId); ibuf.short(this.netId/4294967296|0)
				ibuf.byte(id)
				sock.ibufLastA = id
				sock.ibufLastB = this.netId
			}
			ibuf.byte(slot)
			Item.encode(ibuf, item)
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
	chat(msg){ this.sock?.send(msg) }
	rubber(mv = 63){
		if(!this.sock) return
		this.sock.r = (this.sock.r + 1) & 0xff
		let buf = new DataWriter()
		buf.byte(1)
		buf.uint32(this.sock.netId | 0), buf.uint16(this.sock.netId / 4294967296 | 0)
		buf.byte(this.sock.r)
		buf.float(currentTPS)
		buf.byte(this.sock.perms)
		buf.byte(this.sock.mode)
		this.sock.packets.push(buf.build())
		this.rubberMv |= mv
	}
	event(id, fn){ this.pendingEvents?.push(id, fn) }
	worldEvent(id, fn){
		if(!this.sock) return
		const buf = new DataWriter()
		buf.byte(19)
		buf.byte(id)
		fn?.(buf)
		buf.byte(0)
		this.sock.send(buf.build())
	}
	skyExposed(){
		const ch=this.chunk
		return ch?this.y-ch.exposed[floor(this.x)&63]>=0:true
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
	portalTimeout = 0
	static portalWait = 1
	update(){
		if(!(this.flags&1)) this.portalTimeout = this.portalWait
		else this.flags &= -2
	}
	peek(x, y){
		let ch = this.world.get((x>>>6)+(y>>>6)*0x4000000)
		if(!ch || (this.sock && !ch.sockets.includes(this.sock))) return Blocks.air
		const i = (x & 63) + ((y & 63) << 6)
		return ch[i] == 65535 ? ch.tileData.get(i) : BlockIDs[ch[i]]
	}
}

Object.setPrototypeOf(Entity.prototype, null)
export const EntityIDs = []
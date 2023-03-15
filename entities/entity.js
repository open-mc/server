import { Item } from '../items/item.js'
import { goto } from '../misc/ant.js'
import { DataWriter } from '../utils/data.js'
export let entityMap = new Map(), i = -1
export class Entity{
	constructor(x, y){
		let f = floor(x)
		x = (f >> 0) + (x - f || 0)
		f = floor(y)
		y = (f >> 0) + (y - f || 0)
		this._x = x
		this._y = y
		this._w = null
		this._dx = this._dy = this._f = 0
		this.chunk = null
		this.ochunk = null
		this.mv = 0
		this._state = 0
		this._id = -1
		this.name = ''
		this.age = 0
	}
	place(world){
		if(this._id < 0){
			this._id = ++i
			entityMap.set(i, this)
		}
		if(world.putEntity(this, this._x, this._y, this.id == 0)){
			this.mv = 255
		}else console.warn('\x1b[33m[WARN] Entity placed in unloaded chunk! This is a bad idea as the entity will likely never be ticked or saved to disk!')
	}
	/**
	 * define a new entity definition
	 * @param {Object} obj Properties of the entity
	 * @param {Object} [savedata] Entity data format
	 * @return {Function} constructor for that entity
	 */
	get dx(){return this._dx}
	get dy(){return this._dy}
	get f(){return this._f}
	get state(){return this._state}
	set dx(a){this._dx=a;this.mv|=16}
	set dy(a){this._dy=a;this.mv|=32}
	set f(a){this._f=a;this.mv|=64}
	set state(a){this._state=a;this.mv|=8}
	get x(){return this._x}
	get y(){return this._y}
	get world(){return this._w}
	set world(_){throw new Error('use entity.transport() to change dimension')}
	transport(x, y, w){
		this.mv |= 3
		let f = floor(x)
		x = (f >> 0) + (x - f || 0)
		f = floor(y)
		y = (f >> 0) + (y - f || 0)
		return w.putEntity(this, x, y, true)
	}
	set x(x){
		this.mv |= 1
		const f = floor(x)
		x = (f >> 0) + (x - f || 0)
		if(floor(this._x)>>6 === floor(x)>>6)return void (this._x = x)
		this._w.putEntity(this, x, this._y)
	}
	set y(y){
		this.mv |= 2
		const f = floor(y)
		y = (f >> 0) + (y - f)
		if(floor(this._y)>>6 === floor(y)>>6)return void (this._y = y)
		this._w.putEntity(this, this._x, y)
	}
	move(x, y){
		this.mv |= 3
		let f = floor(x)
		x = (f >> 0) + (x - f || 0)
		f = floor(y)
		y = (f >> 0) + (y - f || 0)
		if(floor(this._x)>>6 === floor(x)>>6 && floor(this._y)>>6 === floor(y)>>6)return (this._x = x, this._y = y, true)
		return this._w.putEntity(this, x, y)
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		return `Entities.${this.className}({ x: \x1b[33m${this.x.toFixed(2)}\x1b[m, y: \x1b[33m${this.y.toFixed(2)}\x1b[m, world: \x1b[32m${this.world ? 'Dimensions.' + this.world.id : 'null'}\x1b[m${Object.hasOwn(this, 'name') ? `, name: \x1b[32m${JSON.stringify(this.name)}\x1b[m` : ''} })`
	}
	goto(){ goto(floor(this.x), floor(this.y), this._w) }
	remove(){
		if(this.chunk){
			this.chunk.entities.remove(this)
			for(const pl of this.chunk.players){
				if(!pl.sock)continue
				pl.sock.ebuf.short(0)
				pl.sock.ebuf.uint32(this._id), pl.sock.ebuf.short(this._id / 4294967296 | 0)
			}
		}else if(this.sock){
			this.sock.ebuf.short(0)
			this.sock.ebuf.uint32(this._id), this.sock.ebuf.short(this._id / 4294967296 | 0)
		}
		this.removed()
		this._w = this.chunk = this.ochunk = null
		entityMap.delete(this._id)
		this._id = -1
		//.died() is only used for when the entity dies naturally (i.e not despawned / unloaded)
	}
	give(stack){
		if(!this.inv) return
		const changed = []
		for(let i = 0; i < this.inv.length; i++){
			let amount = min(stack.count, stack.maxStack)
			if(!this.inv[i]){
				this.inv[i] = stack.constructor(amount)
				stack.count -= amount
			}else if(this.inv[i].constructor == stack.constructor && !stack.savedata){
				amount = min(amount, this.inv[i].maxStack - this.inv[i].count)
				this.inv[i].count += amount
				stack.count -= amount
			}else continue
			changed.push(i)
			if(!stack.count) break
		}
		this.itemschanged(changed)
	}
	itemschanged(slots){
		const buf = new DataWriter()
		buf.byte(32)
		buf.uint32(this._id); buf.short(this._id / 4294967296)
		for(const c of slots) 
			if(c > 127) buf.byte(c), Item.encode(buf, this.items[c&127])
			else buf.byte(c), Item.encode(buf, this.inv[c])
		if(this.chunk)
			for(const pl of this.chunk.players) buf.pipe(pl.sock)
		else if(this.sock) buf.pipe(this.sock)
	}
	died(){}
	placed(){}
	moved(oldx, oldy, oldw){}
	removed(){}
	rubber(){}
	damage(amount, dealer){
		this.health -= amount
		this.damageDealt?.(amount, dealer)
		if(this.health <= 0){
			this.died()
			this.remove()
		}else if(this.health > this.maxHealth){
			this.health = this.maxHealth
		}
		//TODO health packet
	}
	emit(buf){
		if(this.chunk){
			if(buf instanceof DataWriter)
				for(const pl of this.chunk.players) buf.pipe(pl.sock)
			else for(const pl of this.chunk.players) pl.sock.send(buf)
		}else if(this.sock){
			if(buf instanceof DataWriter) buf.pipe(this.sock)
			else this.sock.send(buf)
		}
	}
	event(ev){
		if(!this.chunk){
			if(this.sock){
				this.sock.ebuf.short(ev & 0xff)
				this.sock.ebuf.uint32(this._id); this.sock.ebuf.short(this._id / 4294967296 | 0)
			}
			return
		}
		for(const {sock: {ebuf}} of this.chunk.players){
			ebuf.short(ev & 0xff)
			ebuf.uint32(this._id); ebuf.short(this._id / 4294967296 | 0)
		}
	}
	static savedata = null
	static maxHealth = 20
	static groundDrag = .0000244
	static airDrag = 0.667
	static width = 0.5; static height = 1; static head = 0.5
	static collisionTestPadding = 0
	static gx = 1
	static gy = 1
}

Object.setPrototypeOf(Entity.prototype, null)
export const Entities = Object.create(null)
export const EntityIDs = []
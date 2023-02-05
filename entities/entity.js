import { DataWriter } from '../utils/data.js'
export let entityMap = new Map(), i = -1
export class Entity{
	constructor(x, y){
		if(x !== x || y !== y)throw new TypeError('x and y must be a number')
		let f = Math.floor(x)
		x = (f >> 0) + (x - f || 0)
		f = Math.floor(y)
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
		let f = Math.floor(x)
		x = (f >> 0) + (x - f || 0)
		f = Math.floor(y)
		y = (f >> 0) + (y - f || 0)
		return w.putEntity(this, x, y, true)
	}
	set x(x){
		this.mv |= 1
		const f = Math.floor(x)
		x = (f >> 0) + (x - f || 0)
		if(Math.floor(this._x)>>6 === Math.floor(x)>>6)return void (this._x = x)
		this._w.putEntity(this, x, this._y)
	}
	set y(y){
		this.mv |= 2
		const f = Math.floor(y)
		y = (f >> 0) + (y - f)
		if(Math.floor(this._y)>>6 === Math.floor(y)>>6)return void (this._y = y)
		this._w.putEntity(this, this._x, y)
	}
	move(x, y){
		this.mv |= 3
		let f = Math.floor(x)
		x = (f >> 0) + (x - f || 0)
		f = Math.floor(y)
		y = (f >> 0) + (y - f || 0)
		if(Math.floor(this._x)>>6 === Math.floor(x)>>6 && Math.floor(this._y)>>6 === Math.floor(y)>>6)return (this._x = x, this._y = y, true)
		return this._w.putEntity(this, x, y)
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		return `Entities.${this.className}({ x: \x1b[33m${this.x.toFixed(2)}\x1b[m, y: \x1b[33m${this.y.toFixed(2)}\x1b[m, world: \x1b[32m${this.world ? 'Dimensions.' + this.world.id : 'null'}\x1b[m${Object.hasOwn(this, 'name') ? `, name: \x1b[32m${JSON.stringify(this.name)}\x1b[m` : ''} })`
	}
	remove(){
		if(this.chunk){
			this.chunk.entities.delete(this)
			for(const pl of this.chunk.players){
				if(!pl.sock)continue
				pl.ebuf.byte(0)
				pl.ebuf.int(this._id | 0), pl.ebuf.short(this._id / 4294967296 | 0)
			}
		}else if(this.sock){
			this.ebuf.byte(0)
			this.ebuf.int(this._id | 0), this.ebuf.short(this._id / 4294967296 | 0)
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
			let amount = Math.min(stack.count, stack.maxStack || 64)
			if(!this.inv[i]){
				this.inv[i] = stack.constructor(amount)
				stack.count -= amount
			}else if(this.inv[i].constructor == stack.constructor && !stack.savedata){
				amount = Math.min(amount, (this.inv[i].maxStack || 64) - this.inv[i].count)
				this.inv[i].count += amount
				stack.count -= amount
			}else continue
			changed.push(i)
			if(!stack.count) break
		}
		const buf = new DataWriter()
		buf.byte(32)
		buf.uint32(this._id); buf.short(this._id / 4294967296)
		for(const c of changed) buf.byte(c), buf.item(this.inv[c])
		if(this.chunk)
			for(const pl of this.chunk.players) buf.pipe(pl.sock)
		else if(this.sock) buf.pipe(this.sock)
	}
	static savedatahistory = []
	static savedata = null
	static id = -1
	static maxhealth = 20
	died(){}
	placed(){}
	moved(oldx, oldy, oldw){}
	removed(){}
	rubber(){}
	damage(amount){
		this.health -= amount
		if(this.health < 0){
			this.died()
			this.remove()
		}else if(this.health > this.maxhealth){
			this.health = this.maxhealth
		}
		//TODO health packet
	}
}
Object.setPrototypeOf(Entity.prototype, null)
export const Entities = Object.create(null)
export const EntityIDs = []
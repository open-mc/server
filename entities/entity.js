import { World } from '../world/world.js'
import DEFAULTS from './entitydefaults.js'
export let entityMap = new Map(), i = -1
export class Entity{
	constructor(def, x, y, world){
		this._ = def
		if(x !== x || y !== y)throw new TypeError('x and y must be a number')
		if(!world || world.constructor !== World)throw new TypeError("'world' must be a world")
		let f = Math.floor(x)
		x = (f >> 0) + (x - f || 0)
		f = Math.floor(y)
		y = (f >> 0) + (y - f || 0)
		this._x = x
		this._y = y
		this._w = world
		this._dx = this._dy = this._f = 0
		this._id = -1
		this.chunk = null
		this.ochunk = null
		this.mv = 0
		this._id = ++i
		entityMap.set(i, this)
	}
	place(){
		if(this._w.putEntity(this, this._x, this._y)){
			this.mv = -1
		}else if(this.id)console.warn('\x1b[33m[WARN] Entity placed in unloaded chunk! This is a bad idea as the entity will likely never be ticked or saved to disk!')
	}
	/**
	 * define a new entity definition
	 * @param {Object} obj Properties of the entity
	 * @param {Object} [savedata] Entity data format
	 * @return {Function} constructor for that entity
	 */
	static define(obj = {}, savedata = null){
		let _ = Object.assign(Object.create(null, {savedata:{value:savedata,enumerable:false}, savedatahistory:{value:[],enumerable:false}}), DEFAULTS)
		for(let i in obj){
			if(!(i in Entity.prototype))Object.defineProperty(Entity.prototype, i, {get: new Function('return this._['+JSON.stringify(i)+']')})
			_[i] = obj[i]
		}
		let f = (a, b, c) => new Entity(_, a, b, c)
		f._ = _
		return f
	}
	get dx(){return this._dx}
	get dy(){return this._dy}
	get f(){return this._f}
	set dx(a){this._dx=a;this.mv|=4}
	set dy(a){this._dy=a;this.mv|=8}
	set f(a){this._f=a;this.mv|=16}
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
		return `Entities.${this._.name}({ x: \x1b[33m${this.x.toFixed(2)}\x1b[m, y: \x1b[33m${this.y.toFixed(2)}\x1b[m, world: \x1b[32mDimensions.${this.world.id}\x1b[m${Object.hasOwn(this, 'name') ? `, name: \x1b[32m${JSON.stringify(this.name)}\x1b[m` : ''} })`
	}
	remove(){
		if(this.chunk){
			this.chunk.entities.delete(this)
			for(const pl of this.chunk.players){
				if(!pl.sock)continue
				pl.ebuf.byte(0)
				pl.ebuf.int(this._id | 0), pl.ebuf.short(this._id / 4294967296 | 0)
			}
		}
		entityMap.delete(this._id)
		this.removed()
		//._.died() is only used for when the entity dies naturally (i.e not despawned / unloaded)
	}
}
Entity.prototype.name = ''
for(let i in DEFAULTS){
	if(!(i in Entity.prototype))
		Object.defineProperty(Entity.prototype, i, {get: new Function('return this._['+JSON.stringify(i)+']')})
}
Object.setPrototypeOf(Entity.prototype, null)
export const Entities = Object.create(null)
export const EntityIDs = []
import { Chunk } from '../world/chunk.js'
import { World } from '../world/world.js'
import DEFAULTS from './entitydefaults.js'
export let entityMap = new Map(), i = -1
export class Entity{
	constructor(def, x, y, world){
		this._ = def
		if(x !== x || y !== y)throw new TypeError('x and y must be a number')
		if(!world || world.constructor !== World)throw new TypeError("'world' must be a world")
		this._x = x
		this._y = y
		this.dx = this.dy = this.f = 0
		if(world instanceof Chunk){
			this.chunk = world
			this._w = world.world
			world.entities.add(this)
		}else{
			this._w = world
			this.chunk = null
			if(!world.putEntity(this, x, y) && this.id)
				console.warn('\x1b[33m[WARN] Entity created in unloaded chunk! This is a bad idea as the entity will likely never be ticked or saved to disk!')
		}
		this._id = ++i
		entityMap.set(i, this)
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
	get x(){return this._x}
	get y(){return this._y}
	get world(){return this._w}
	set world(_){throw new Error('use entity.transport() to change dimension')}
	transport(x, y, w){
		let f = Math.floor(x)
		x = (f >> 0) + (x - f)
		f = Math.floor(y)
		y = (f >> 0) + (y - f)
		if(w.putEntity(this, x, y)){
			let oldw = this._w
			this._w = w
			this.moved(this._x, this._y, (this._x = x, this._y = y, oldw))
		}
	}
	set x(x){
		const f = Math.floor(x)
		x = (f >> 0) + (x - f)
		if(Math.floor(this._x)>>6 === Math.floor(x)>>6)return void (this._x = x)
		if(this._w.putEntity(this, x, this._y)){
			this.moved(this._x, this._y, (this._x = x, this._w))
		}
	}
	set y(y){
		const f = Math.floor(y)
		y = (f >> 0) + (y - f)
		if(Math.floor(this._y)>>6 === Math.floor(y)>>6)return void (this._y = y)
		if(this._w.putEntity(this, this._x, y)){
			this.moved(this._x, this._y, (this._y = y, this._w))
		}
	}
	tp(x, y){
		let f = Math.floor(x)
		x = (f >> 0) + (x - f)
		f = Math.floor(y)
		y = (f >> 0) + (y - f)
		if(Math.floor(this._x)>>6 === Math.floor(x)>>6 && Math.floor(this._y)>>6 === Math.floor(y)>>6)return void (this._x = x, this._y = y)
		if(this._w.putEntity(this, x, y)){
			this.moved(this._x, this._y, (this._x = x, this._y = y, this._w))
		}
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		return `Entities.${this._.name}({ x: \x1b[33m${this.x.toFixed(2)}\x1b[m, y: \x1b[33m${this.y.toFixed(2)}\x1b[m, world: \x1b[32mDimensions.${this.world.id}\x1b[m${Object.hasOwn(this, 'name') ? `, name: \x1b[32m${JSON.stringify(this.name)}\x1b[m` : ''} })`
	}
	remove(){
		if(this.chunk)this.chunk.entities.delete(this)
		entityMap.delete(this._id)
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
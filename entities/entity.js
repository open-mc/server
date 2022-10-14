import { Dimensions } from '../world/dimensions.js'
import { World } from '../world/world.js';
import DEFAULTS from './entitydefaults.js'

let new_entity = function(x, y, world, data = {}){
	if(x !== x || y !== y)throw new TypeError('x and y must be a number')
	if(!world || world.constructor !== World)throw new TypeError("'world' must be a world")
	data._ = this
	Object.setPrototypeOf(data, Entity.prototype)
	data._x = x
	data._y = y
	data.dx = data.dy = data.f = 0
	data._w = world || Dimensions.overworld
	data.chunk = null
	world.fetchonce(Math.floor(x) >> 6, Math.floor(y) >> 6).then(data._setchunk.bind(data))
	return data
}
export class Entity{
	/**
	 * define a new entity definition
	 * @param {Object} obj Properties of the entity
	 * @param {Object} [savedata] Entity data format
	 * @return {Function} constructor for that entity
	 */
	constructor(obj = {}, savedata = null){
		this._ = Object.assign(Object.create(null), DEFAULTS)
		for(let i in obj){
			if(!(i in Entity.prototype))
				Object.defineProperty(Entity.prototype, i, {get: new Function('return this._['+JSON.stringify(i)+']')})
			this._[i] = obj[i]
		}
		let f = new_entity.bind(this._)
		f.original = this
		f._ = this._
		this._._savedata = savedata
		return f
	}
	get x(){return this._x}
	get y(){return this._y}
	get world(){return this._w}
	set world(_){throw new Error('use entity.transport() to change dimension')}
	transport(x, y, w){
		this.chunk && this.chunk.entities.delete(this)
		this.chunk = null
		const _w = this._w
		const _x = this._x, _y = this._y
		let f = Math.floor(x)
		this._x = (f >> 0) + (x - f)
		f = Math.floor(y)
		this._y = (f >> 0) + (y - f)
		this.moved(_x, _y, _w)
		w.fetchonce(Math.floor(x) >> 6, Math.floor(y) >> 6).then(this._setchunk.bind(this))
	}
	_setchunk(chunk){
		if(Math.floor(this._x / 64) !== chunk.x || Math.floor(this._y / 64) !== chunk.y)return
		this.chunk = chunk
		chunk.entities.add(this)
	}
	set x(x){
		if(Math.floor(this._x)>>6 === Math.floor(x)>>6)return void (this._x = x)
		this.chunk && this.chunk.entities.delete(this)
		this.chunk = null
		const _x = this._x
		const f = Math.floor(x)
		this._x = (f >> 0) + (x - f)
		this.moved(_x, this._y, this._w)
		this._w.fetchonce(Math.floor(this._x) >> 6, Math.floor(this._y) >> 6).then(this._setchunk.bind(this))
	}
	set y(y){
		if(Math.floor(this._y)>>6 === Math.floor(y)>>6)return void (this._y = y)
		this.chunk && this.chunk.entities.delete(this)
		this.chunk = null
		const _y = this._y
		const f = Math.floor(y)
		this._y = (f >> 0) + (y - f)
		this.moved(this._x, _y, this._w)
		this._w.fetchonce(Math.floor(this._x) >> 6, Math.floor(this._y) >> 6).then(this._setchunk.bind(this))
	}
	tp(x, y){
		if(Math.floor(this._x)>>6 === Math.floor(x)>>6 && Math.floor(this._y)>>6 === Math.floor(y)>>6)return void (this._x = x, this._y = y)
		this.chunk && this.chunk.entities.delete(this)
		this.chunk = null
		const _x = this._x
		const _y = this._y
		let f = Math.floor(x)
		this._x = (f >> 0) + (x - f)
		f = Math.floor(y)
		this._y = (f >> 0) + (y - f)
		this.moved(_x, _y, this._w)
		this._w.fetchonce(Math.floor(this._x) >> 6, Math.floor(this._y) >> 6).then(this._setchunk.bind(this))
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		return `Entities.${this._.name}({ x: \x1b[33m${this.x.toFixed(2)}\x1b[m, y: \x1b[33m${this.y.toFixed(2)}\x1b[m, world: \x1b[32mDimensions.${this.world.id}\x1b[m${Object.hasOwn(this, 'name') ? `, name: \x1b[32m${JSON.stringify(this.name)}\x1b[m` : ''} })`
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
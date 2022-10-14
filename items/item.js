import { util } from '../internals.js'
import DEFAULTS from './itemdefaults.js'

let stack = function(count = 1, data = {}){
	data._ = this
	Object.setPrototypeOf(data, Item.prototype)
	data.count = count
	return data
}
export class Item{
	/**
	 * define a new item definition
	 * @param {Object} obj Properties of the item
	 * @param {Object} [savedata] Item data format
	 * @return {Function} constructor for that item
	 */
	constructor(obj = {}, savedata = null){
		this._ = Object.assign(Object.create(null), DEFAULTS)
		for(let i in obj){
			if(!(i in Item.prototype))
				Object.defineProperty(Item.prototype, i, {get: new Function('return this._['+JSON.stringify(i)+']')})
			this._[i] = obj[i]
		}
		let f = stack.bind(this._)
		f.original = this
		f._ = this._
		this._._savedata = savedata
		return f
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		return 'Items.'+this._.name+'()'
	}
}
for(let i in DEFAULTS){
	if(!(i in Item.prototype))
		Object.defineProperty(Item.prototype, i, {get: new Function('return this._['+JSON.stringify(i)+']')})
}

Object.setPrototypeOf(Item.prototype, null)
export const Items = Object.create(null)
export const ItemIDs = []
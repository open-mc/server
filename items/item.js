import { util } from '../internals.js'
import DEFAULTS from './itemdefaults.js'

export class Item{
	constructor(def, count = 1){
		this._ = def
		this.count = count
	}
	/**
	 * define a new item definition
	 * @param {Object} obj Properties of the item
	 * @param {Object} [savedata] Item data format
	 * @return {Function} constructor for that item
	 */
	static define(obj = {}, savedata = null){
		let _ = Object.assign(Object.create(null, {savedata:{value:savedata,enumerable:false}, savedatahistory:{value:[],enumerable:false}}), DEFAULTS)
		for(let i in obj){
			if(!(i in Item.prototype))Object.defineProperty(Item.prototype, i, {get: new Function('return this._['+JSON.stringify(i)+']')})
			_[i] = obj[i]
		}
		let f = i => new Item(_, i)
		f._ = _
		return f
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		return 'Items.'+this._.name+'()'
	}
}
Item.prototype.name = ''
for(let i in DEFAULTS){
	if(!(i in Item.prototype))
		Object.defineProperty(Item.prototype, i, {get: new Function('return this._['+JSON.stringify(i)+']')})
}

Object.setPrototypeOf(Item.prototype, null)
export const Items = Object.create(null)
export const ItemIDs = []
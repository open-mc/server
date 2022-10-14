import { util } from '../internals.js';
import DEFAULTS from './blockdefaults.js';
const from = function(data = {}){
	data._ = this
	Object.setPrototypeOf(data, Block.prototype)
	return data
}
export class Block{
	/**
	 * define a new block definition
	 * @param {*} obj Properties of the block
	 */
	constructor(obj = {}, savedata = null){
		this._ = Object.assign(Object.create(null), DEFAULTS)
		for(let i in obj){
			if(!(i in Block.prototype))
				Object.defineProperty(Block.prototype, i, {get: new Function('return this._['+JSON.stringify(i)+']')})
			this._[i] = obj[i]
		}
		let f = savedata ? from.bind(this._) : () => this
		f._ = this._
		f.original = this
		this._._savedata = savedata
		return f
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		return `Blocks.${this._.name}(${this._._savedata ? '{...}' : ''})`
	}
}
for(let i in DEFAULTS){
	if(!(i in Block.prototype))
		Object.defineProperty(Block.prototype, i, {get: new Function('return this._['+JSON.stringify(i)+']')})
}

Object.setPrototypeOf(Block.prototype, null)
export const Blocks = Object.create(null)
export const BlockIDs = []
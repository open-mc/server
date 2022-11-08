import { util } from '../internals.js'
import DEFAULTS from './blockdefaults.js'
const give = a => a

export class Block{
	constructor(def){this._ = def}
	/**
	 * define a new block definition
	 * @param {*} obj Properties of the block
	 * @param {Object} [savedata] Block data format
	 * @return {Function} constructor for that block
	 */
	static define(obj = {}, savedata = null){
		let _ = Object.assign(Object.create(null, {savedata:{value:savedata,enumerable:false}, savedatahistory:{value:[],enumerable:false}}), DEFAULTS)
		for(let i in obj){
			if(!(i in Block.prototype))Object.defineProperty(Block.prototype, i, {get: new Function('return this._['+JSON.stringify(i)+']')})
			_[i] = obj[i]
		}
		let f = savedata ? () => new Block(_) : give.bind(undefined, new Block(_))
		f._ = _
		return f
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		return `Blocks.${this._.name}(${this._.savedata ? '{...}' : ''})`
	}
}
Block.prototype.name = ''
for(let i in DEFAULTS){
	if(!(i in Block.prototype))
		Object.defineProperty(Block.prototype, i, {get: new Function('return this._['+JSON.stringify(i)+']')})
}

Object.setPrototypeOf(Block.prototype, null)
export const Blocks = Object.create(null)
export const BlockIDs = []
import { addBiome } from "./util/outer-noise.js"

export const Blocks = {}
export const BlockIDs = []
export const Items = {}
export const ItemIDs = []
export const Entities = {}
export const EntityIDs = []
export const Shapers = {__proto__: null}
export const Biomes = {__proto__: null}
export const Features = {__proto__: null}

export const voidShaper = (x, y, o) => { o.offset = -2000; o.temperature = o.humidity = 0.5 }

export const _biomeArr = []
export class Biome{
	constructor(o){
		Object.assign(this, o)
		if(!this.priority) this.temperature = this.humidity = -Infinity
		let top = 0
		if(this.features){
			for(let l=this.features.length-1,i=0;i<l; i+=2){
				this.features[i+1] = floor(max(0, min(.999999999999, top += this.features[i+1])) * 4294967296 - 2147483648) | 0
			}
			if(top > 1){
				top = 1/top
				for(let l=this.features.length-1,i=0;i<l; i+=2)
					this.features[i+1] = floor((this.features[i+1] + 2147483648)*tot - 2147483648) | 0
			}
		}
	}
	static register(arr){
		const next = []
		for(const b2 of arr) next.push(b2.children.length ? (Biome.register(b2.children), b2.children[0].id) : 0)
		let i = 0
		for(const b2 of arr){
			b2.id = addBiome(b2.temperature, b2.humidity, b2.priority, b2.airBlock ? b2.airBlock.id : 2147483647, b2.children.length, next[i])
			b2.features ??= []
			_biomeArr.push(b2)
		}
	}
	children = []
	id = -1
	temperature = 0.5
	humidity = 0.5
	priority = 1
	airBlock = null
	
	surface = null
	features = null
	
	add(o){
		if(!(o instanceof Biome)) o = new Biome(o)
		else if(o.id != -1) throw 'Invalid/circular biome'
		o.id = -2
		this.children.push(o)
		o.surface ??= this.surface
		o.features ??= this.features
		for(const k in this) if(!(k in o)) o[k] = this[k]
		return o
	}
}
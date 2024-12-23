import { addBiome } from "./util/outer-noise.js"

export const Blocks = {}
export const BlockIDs = []
export const Items = {}
export const ItemIDs = []
export const Entities = {}
export const EntityIDs = []
export const Shapers = {}
export const Biomes = {}

export const voidShaper = (x, y, o) => { o.offset = -2000; o.temperature = o.humidity = 0.5 }

export const _biomeArr = []
export class Biome extends Array{
	constructor(o){ super(); Object.assign(this, o) }
	static register(arr){
		const next = []
		for(const b2 of arr) next.push(b2.children.length ? (Biome.register(b2.children), b2.children[0].id) : 0)
		let i = 0
		for(const b2 of arr){
			b2.id = addBiome(b2.temperature, b2.humidity, b2.priority, b2.airBlock ? b2.airBlock.id : 2147483647, b2.children.length, next[i])
			_biomeArr.push(b2)
		}
	}
	children = []
	temperature = 0.5
	humidity = 0.5
	priority = 1
	airBlock = null
	surface = null
	id = -1
	add(o){
		if(!(o instanceof Biome)) o = new Biome(o)
		if(o.id != -1) throw 'Invalid/circular biome'
		o.id = -2
		this.children.push(o)
		o.surface ??= this.surface
		for(const k in this) if(!(k in o)) o[k] = this[k]
		return o
	}
}
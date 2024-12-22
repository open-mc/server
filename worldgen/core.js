import { Shapers, voidShaper, Blocks, Biomers, voidBiomer } from './globals.js'
import { BiomeChunk, _biomeChunks, _noiseChunks, NoiseChunk, _setChunkPos, goto, place, down, peekNoise, getY, getX } from './util/chunk.js'
import { expand, genNoisev, seed } from './util/outer-noise.js'
import { hash2, hashCode, LowNoise1D, setPartialSeed } from './util/random.js'

// b b b b b b b b b
// b b b b b b b b b
// b b b b b b b b b
// b b b n n n b b b
// b b b n x n b b b
// b b b n n n b b b
// b b b b b b b b b
// b b b b b b b b b
// b b b b b b b b b
// b = biome
// n = noise
// x = features

const ZERO = new NoiseChunk(Infinity, 512), ONE = new NoiseChunk(Infinity, 512).fill(255)
const depth = LowNoise1D('depth')
export class WorldCache{
	localSeed = 0
	shaper = voidShaper
	biomer = voidBiomer
	temperatureOffset = 0
	humidityOffset = 0
	airl = []
	airMod = 0
	groundl = []
	groundMod = 0
	period = 7
	roughness = 0.5
	maxScale = 1
	constructor(k){ this.localSeed = hashCode(k) }
	// TTL: 60mins
	biomeCache = new Map()
	// TTL: 15mins
	noiseCache = new Map()
	fetchArea(x, y){
		const now = Date.now()
		// Coffee is bad, trust me
		const l = this.localSeed^0xC0FFEBAD, ex = x+320|0, sy = y-256|0, ey = y+320|0
		setPartialSeed(hash2(seed[2], l), hash2(seed[3], l), hash2(seed[4], l), hash2(seed[5], l))
		for(let xi = x-256|0, i = 0; xi != ex; xi=xi+64|0) for(let yi = sy; yi != ey; yi=yi+64|0, i++){
			const k = (xi>>>6)+(yi>>>6)*0x4000000
			let c = this.biomeCache.get(k)
			if(c) c.expires = now + 3600e3
			else{
				const v = {offset: 0, temperature: 0, humidity: 0}
				this.biomeCache.set(k, c = new BiomeChunk(now + 3600e3))
				for(let yj = 0, j = 0; yj <= 64; yj+=16) for(let xj = 0; xj <= 64; xj+=16,j++){
					// TODO: temp/humd
					this.shaper(xi+xj, yi+yj, v)
					c[j] = v.offset; c[j+25] = v.temperature + this.temperatureOffset; c[j+50] = v.humidity + this.humidityOffset
				}
				const M = this.maxScale
				a: if(c[0] >= M){
					for(let j = 1; j < 25; j++) if(c[j] < M) break a
					c.uniform = ONE
				}else if(c[0] <= -M){
					for(let j = 1; j < 25; j++) if(c[j] > -M) break a
					c.uniform = ZERO
				}
			}
			_biomeChunks[i] = c
			const xi1 = (xi-x>>6)+1&0xff, yi1 = (yi-y>>6)+1&0xff
			if(xi1 >= 3 || yi1 >= 3) continue
			if(c.uniform) _noiseChunks[xi1+yi1*3] = c.uniform
			else{
				let c1 = this.noiseCache.get(k)
				if(c1) c1.expires = now + 900e3
				else this.noiseCache.set(k, c1 = new NoiseChunk(now + 900e3, genNoisev(c, xi, yi, this.localSeed, this.period, this.roughness)))
				_noiseChunks[xi1+yi1*3] = c1
			}
		}
		setPartialSeed(hash2(seed[4], l), hash2(seed[5], l), hash2(seed[6], l), hash2(seed[7], l))
		const ay = this.airMod?y%this.airMod+(-(y<0)&this.airMod):y, gy = this.groundMod?y%this.groundMod+(-(y<0)&this.groundMod):y
		let i = 0, ab, gb, o = this.airl[0]
		while(o && o.minY<=ay) ab = o, o = this.airl[++i]
		o = this.groundl[0]; i = 0
		while(o && o.minY<=gy) gb = o, o = this.groundl[++i]
		
		_setChunkPos(x, y)
		for(const i of expand(x, y, this.localSeed, ab, gb, _noiseChunks[4], new Uint8Array(_noiseChunks[7].buffer, 0, 128), new Uint8Array(_noiseChunks[1].buffer, 384, 128))){
			goto(i)
			if(this.biomer == Biomers.overworld){
				let d = round(depth(getX())*2+5)
				let y = getY()
				if(y < 1){
					while(d--){
						if(!peekNoise()) break
						place(y-- < -16 ? Blocks.gravel : Blocks.sand)
						down()
					}
				}else{
					place(Blocks.grass)
					while(--d){
						down()
						if(!peekNoise()) break
						place(Blocks.dirt)
					}
				}
			}
		}
	}
}

export const cache = new Map()

function parseLayers(arr, list){
	let l = new Int32Array(192), i = 0
	let y = l.minY = -2147483648, bl = Blocks.air.id
	arr.length = 0; arr.push(l)
	let a = NaN, b = NaN
	for(const n of list){
		if(typeof n != 'string'){
			if(a == a) b = +n
			else a = +n
			continue
		}
		const ob = bl; bl = (Blocks[n]??Blocks.air).id
		if(a != a) continue
		let a1 = a, b1 = min(b>>>0, 64); a = b = NaN
		if(a1 >= y+64){
			if(i){
				while(i < 192) l[i] = 0, l[i+1] = ob, i += 3
				arr.push(l = new Int32Array(192)), i = 0; l.minY = y += 64
			}
			if(a1 >= y+64){
				while(i < 192) l[i] = 0, l[i+1] = ob, i += 3
				arr.push(l = new Int32Array(192)), i = 0; l.minY = y = a1&-64
			}
			const t = (a1-y) * 3
			while(i < t) l[i] = 0, l[i+1] = ob, i += 3
		}else{
			const t = (a1-y) * 3
			while(i < t) l[i] = 0, l[i+1] = ob, i += 3
		}
		if(!b1) continue
		for(const t = 256/(b1+1); b1; b1--){
			let a = round(b1*t); a |= a<<8
			l[i] = a | a<<16;
			l[i+1] = bl; l[i+2] = ob
			if((i += 3) == 192){
				arr.push(l = new Int32Array(192)), i = 0; l.minY = y += 64
			}
		}
	}
	if(i){
		while(i < 192) l[i] = 0, l[i+1] = bl, i += 3
		arr.push(l = new Int32Array(192)), i = 0; l.minY = y += 64
	}
	while(i < 192) l[i] = 0, l[i+1] = bl, i += 3
}

export function setGenerators(g){
	for(const k in g){
		const {
			shaper, value = 0,
			air_layers = [], ground_layers = [],
			temperature = .5, humidity = .5,
			air_layers_repeat = 0, ground_layers_repeat = 0,
			period = 128, roughness = 0.5,
			biomer
		} = g[k]
		let w = cache.get(k)
		const sh = Shapers[shaper]?.(value) ?? voidShaper
		const b = Biomers[biomer] ?? voidBiomer
		if(sh == voidShaper) console.warn('No shaper named %s, defaulting to void', shaper)
		if(b == voidBiomer) console.warn('No biomer named %s, defaulting to void', biomer)
		if(!w) cache.set(k, w = new WorldCache(k))
		w.shaper = sh; w.biomer = b
		w.temperatureOffset = temperature-.5
		w.humidityOffset = humidity-.5
		w.airMod = air_layers_repeat & -64
		w.groundMod = ground_layers_repeat & -64
		w.period = min(31, max(2, log2(period)))
		w.roughness = max(0, min(1, roughness)) || 0
		let p = ceil(w.period), m = 0, s = 1
		while(p-- > 1) m += s, s *= w.roughness
		w.maxScale = m

		parseLayers(w.airl, air_layers)
		parseLayers(w.groundl, ground_layers)
	}
}

export function expireCaches(){
	const now = Date.now()
	for(const v of cache.values()){
		const m1 = v.biomeCache
		for(const {0:k,1:ch} of m1){
			if(ch.expires < now) m1.delete(k)
			else break
		}
		const m2 = v.noiseCache
		for(const {0:k,1:ch} of m2){
			if(ch.expires < now) m2.delete(k)
			else break
		}
	}
}
setInterval(expireCaches, 120e3)
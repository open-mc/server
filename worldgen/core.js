import { Shapers, voidShaper, Blocks, Biomes, Features } from './globals.js'
import { BiomeChunk, _biomeChunks, _noiseChunks, NoiseChunk, _setChunkPos, goto, gotopos, airBlockArrays, peekBiome, biomeData, groundBlockArrays, _surfaceFeature } from './util/chunk.js'
import { expand, genNoisev, seed } from './util/outer-noise.js'
import { hash2, hash3, hashCode, setPartialSeed, sdA, sdB, sdC, sdD } from './util/random.js'

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
export class WorldCache{
	localSeed = 0; bSeed = 0
	shaper = voidShaper
	biome = Biomes.void.id
	temperatureOffset = 0
	humidityOffset = 0
	airl = []
	airMod = 0
	groundl = []
	groundMod = 0
	period = 7
	roughness = 0.5
	maxScale = 1
	features = []
	constructor(k){ this.localSeed = hashCode(k); this.bSeed = hash2(seed[3]^seed[2]^seed[1], this.localSeed) }
	// TTL: 60mins
	biomeCache = new Map()
	// TTL: 15mins
	noiseCache = new Map()
	generate(x, y){
		const now = Date.now()
		// Coffee is bad, trust me
		const l = this.localSeed^0xC0FFEBAD, ex = x+320|0, sx = x-256|0, ey = y+320|0
		setPartialSeed(hash2(seed[2], l), hash2(seed[3], l), hash2(seed[4], l), hash2(seed[5], l))
		for(let yi = y-256|0, i = 0; yi != ey; yi=yi+64|0) for(let xi = sx; xi != ex; xi=xi+64|0, i++){
			const k = (xi>>>6)+(yi>>>6)*0x4000000
			let c = this.biomeCache.get(k)
			if(c) c.expires = now + 3600e3, this.biomeCache.delete(k)
			else{
				const v = {offset: 0, temperature: 0, humidity: 0}
				c = new BiomeChunk(now + 3600e3)
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
			this.biomeCache.set(k, c)
			_biomeChunks[i] = c
			const xi1 = (xi-x>>6)+1&0xff, yi1 = (yi-y>>6)+1&0xff
			if(xi1 >= 3 || yi1 >= 3) continue
			if(c.uniform) _noiseChunks[xi1+yi1*3] = c.uniform
			else{
				let c1 = this.noiseCache.get(k)
				if(c1) c1.expires = now + 900e3, this.noiseCache.delete(k)
				else c1 = new NoiseChunk(now + 900e3, genNoisev(c, xi, yi, this.localSeed, this.period, this.roughness))
				this.noiseCache.set(k, c1)
				_noiseChunks[xi1+yi1*3] = c1
			}
		}
		setPartialSeed(hash2(seed[4], l), hash2(seed[5], l), hash2(seed[6], l), hash2(seed[7], l))
		const y0 = y-256|0
		let ay = this.airMod?y0%this.airMod+(-(y0<0)&this.airMod):y0
		let gy = this.groundMod?y0%this.groundMod+(-(y0<0)&this.groundMod):y0
		let o = this.airl[0], i = 0, last = null
		for(let j = 0; j < 9; j++){
			while(o && o.minY<=ay) last = o, o = this.airl[++i];
			airBlockArrays[j] = last
			if(!this.airMod) ay = ay+64|0
			else if((ay += 64) == this.airMod) ay = 0
		}
		o = this.groundl[0]; i = 0; last = null
		for(let j = 0; j < 9; j++){
			while(o && o.minY<=gy) last = o, o = this.groundl[++i];
			groundBlockArrays[j] = last
			if(!this.groundMod) gy = gy+64|0
			else if((gy += 64) == this.groundMod) gy = 0
		}
		_setChunkPos(x, y, this.bSeed, this.biome)
		expand(x, y, this.localSeed, airBlockArrays[4], groundBlockArrays[4], new Uint8Array(_noiseChunks[4].buffer, 0, 512))
		let c = _noiseChunks[1]; i = c.length-2
		for(; i >= 512; i -= 2) if((c[i]|c[i+1]<<8) < 3072) break
		for(let e = c.length; i < e; i += 2)
			gotopos((c[i]|c[i+1]<<8)-4096), peekBiome().surface?.()
		{
			const c2 = _noiseChunks[4]; let i0 = 0, l = 0
			i0 = (c[504]|c[505]<<8|c[506]<<16|c[507]<<24)&~(c2[0]|c2[1]<<8|c2[2]<<16|c2[3]<<24)
			while((l = 31-clz32(i0)) >= 0){ i0 &= ~(1<<l); gotopos(l); peekBiome().surface?.() }
			i0 = (c[508]|c[509]<<8|c[510]<<16|c[511]<<24)&~(c2[4]|c2[5]<<8|c2[6]<<16|c2[7]<<24)
			while((l = 31-clz32(i0)) >= 0){ i0 &= ~(1<<l); gotopos(l+32); peekBiome().surface?.() }
			c = c2
		}
		for(let e = c.length, i = 512; i < e; i += 2)
			gotopos((c[i]|c[i+1]<<8)), peekBiome().surface?.()
		{
			const c2 = _noiseChunks[7]; let i0 = 0, l = 0
			i0 = (c[504]|c[505]<<8|c[506]<<16|c[507]<<24)&~(c2[0]|c2[1]<<8|c2[2]<<16|c2[3]<<24)
			while((l = 31-clz32(i0)) >= 0){ i0 &= ~(1<<l); gotopos(l+4096); peekBiome().surface?.() }
			i0 = (c[508]|c[509]<<8|c[510]<<16|c[511]<<24)&~(c2[4]|c2[5]<<8|c2[6]<<16|c2[7]<<24)
			while((l = 31-clz32(i0)) >= 0){ i0 &= ~(1<<l); gotopos(l+4128); peekBiome().surface?.() }
			c = c2
		}
		for(let e = c.length, i = 512; i < e; i += 2){
			const k = c[i]|c[i+1]<<8
			if(k >= 1024) break
			gotopos(k+4096); peekBiome().surface?.()
		}
		for(const f of this.features) for(let dx=-64;dx<128;dx+=64) for(let dy=-64;dy<128;dy+=64){
			let i = hash3(sdC^sdD^f.hash, x+dx, y+dy)
			const n = sdC^sdD^(x+dx)^(y+dy), ni = i
			for(;;){
				goto(i&63|dx,i>>6&63|dy)
				if(!(f((hash2(n^sdA^sdC, i)*.23283064365386963e-9+(i>>>12))*.95367431640625e-6)??true)) break
				if((i = hash2(n, i)) == ni) break
			}
		}
		for(let x=0;x<3;x++){
			const xo = (x<<6)-64
			let c = _noiseChunks[x]
			for(let i = 512, e = c.length; i < e; i += 2)
				_surfaceFeature((c[i]|c[i+1]<<8)-4096, xo)
			{
				const c2 = _noiseChunks[x+3]; let i0 = 0, l = 0
				i0 = (c[504]|c[505]<<8|c[506]<<16|c[507]<<24)&~(c2[0]|c2[1]<<8|c2[2]<<16|c2[3]<<24)
				while((l = 31-clz32(i0)) >= 0){ i0 &= ~(1<<l); _surfaceFeature(l, xo) }
				i0 = (c[508]|c[509]<<8|c[510]<<16|c[511]<<24)&~(c2[4]|c2[5]<<8|c2[6]<<16|c2[7]<<24)
				while((l = 31-clz32(i0)) >= 0){ i0 &= ~(1<<l); _surfaceFeature(l+32, xo) }
				c = c2
			}
			for(let i = 512, e = c.length; i < e; i += 2)
				_surfaceFeature((c[i]|c[i+1]<<8), xo)
			{
				const c2 = _noiseChunks[x+6]; let i0 = 0, l = 0
				i0 = (c[504]|c[505]<<8|c[506]<<16|c[507]<<24)&~(c2[0]|c2[1]<<8|c2[2]<<16|c2[3]<<24)
				while((l = 31-clz32(i0)) >= 0){ i0 &= ~(1<<l); _surfaceFeature(l+4096, xo) }
				i0 = (c[508]|c[509]<<8|c[510]<<16|c[511]<<24)&~(c2[4]|c2[5]<<8|c2[6]<<16|c2[7]<<24)
				while((l = 31-clz32(i0)) >= 0){ i0 &= ~(1<<l); _surfaceFeature(l+4128, xo) }
				c = c2
			}
			for(let i = 512, e = c.length; i < e; i += 2)
				_surfaceFeature((c[i]|c[i+1]<<8)+4096, xo)
		}
		const b = _biomeChunks[40]
		for(let x = 0; x < 5; x++){
			let t = 0, h = 0, i = x+25
			for(let y = 0; y < 5; y++){
				t += min(1, max(0, b[i])); h += min(1, max(0, b[i+25]))
				i += 5
			}
			biomeData[x<<1] = round(t*51)
			biomeData[x<<1|1] = round(h*51)
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
			biome, features = []
		} = g[k]
		let w = cache.get(k)
		if(!w) cache.set(k, w = new WorldCache(k))
		const sh = Shapers[shaper]?.(value) ?? voidShaper
		const b = Biomes[biome]
		if(sh == voidShaper) console.warn('\x1b[33mNo shaper named %s, defaulting to void', shaper)
		if(!b) console.warn('\x1b[33mNo biome named %s, defaulting to void', biome)
		w.shaper = sh; w.biome = (b??Biomes.void).id
		w.temperatureOffset = temperature-.5
		w.humidityOffset = humidity-.5
		w.airMod = air_layers_repeat & -64
		w.groundMod = ground_layers_repeat & -64
		w.period = min(31, max(2, log2(period)))
		w.roughness = max(0, min(1, roughness)) || 0
		w.features = features.map(a => Features[a] ?? (console.warn('No such feature: %s', a),[])).flat(Infinity)
		let p = ceil(w.period), m = 0, s = 1
		while(p-- > 1) m += s, s *= w.roughness
		w.maxScale = m
		w.noiseCache.clear()
		w.biomeCache.clear()

		parseLayers(w.airl, air_layers)
		parseLayers(w.groundl, ground_layers)
	}
	for(const b of cache.values()){
		b.bSeed = hash2(seed[3]^seed[2]^seed[1], b.localSeed)
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
import { Worker, argv } from '../internals.js'
import { CONFIG, stat } from '../config.js'
import { gotStats } from '../internals.js'
import { DataReader } from '../utils/data.js'
const gen = new Worker(PATH + 'worldgen/genprocess.js', { argv })
const loaded = task('Loading WorldGen process...')
const waiting = new Map()
let key = 0
gen.on('message', function({key, buf}){
	if(key == -1)return loaded('WorldGen process loaded')
	else if(key == -2)return gotStats(1,arguments[0])
	stat('world', 'chunks_generated')
	stat('world', 'chunk_revisits', -1)
	waiting.get(key)(new DataReader(buf))
	waiting.delete(key)
})
export const generator = (x, y, d) => new Promise(r => {
	x = x << 6 >> 6; y = y << 6 >> 6
	waiting.set(key, r)
	gen.postMessage({x, y, d, key, seed: CONFIG.world.seed, name: CONFIG.generators[d]})
	key++
})
gen.on('exit', () => process.exit(0))
globalThis.genprocess = gen
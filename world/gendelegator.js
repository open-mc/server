import { Worker, argv } from '../internals.js'
import { CONFIG, stat } from '../config.js'
import { gotStats } from '../internals.js'
import { DataReader } from '../utils/data.js'
let gen = new Worker(PATH + 'world/gen/genprocess.js', { argv })
const waiting = new Map()
gen.on('message', function({key, buf}){
	if(key == 'ready')return progress('WorldGen process loaded')
	else if(key == 'stat')return gotStats(2,arguments[0])
	stat('world', 'chunks_generated')
	stat('world', 'chunk_revisits', -1)
	waiting.get(key)(new DataReader(buf))
	waiting.delete(key)
})
export const generator = (x, y, d) => new Promise(r => {
	x = x << 6 >> 6; y = y << 6 >> 6
	waiting.set(x+' '+y+' '+d, r)
	gen.postMessage({x, y, d, seed: CONFIG.seed, name: CONFIG.generators[d]})
})
gen.on('exit', () => process.exit(0))
globalThis.genprocess = gen
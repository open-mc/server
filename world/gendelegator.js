import { blockindex } from '../blocks/index.js'
import { itemindex } from '../items/index.js'
import { entityindex } from '../entities/index.js'
import { stat } from './index.js'

const loaded = task('Loading WorldGen process...')
const gen = new Worker('./worldgen/genprocess.js')

let waiting = [], i = 0
let onmsg = function({data: a}){
	if(!(a instanceof ArrayBuffer)) return perf.addData(1,a)
	stat('world', 'chunks_generated')
	stat('world', 'chunk_revisits', -1)
	waiting[i++](a)
	if(i > (waiting.length>>1)) waiting = waiting.slice(i), i = 0
}
gen.addEventListener('message', () => {
	gen.postMessage({indices: [blockindex, itemindex, entityindex], seed: CONFIG.world.seed+'', generators: CONFIG.generators})
	gen.addEventListener('message', () => {
		loaded('WorldGen process loaded')
		gen.onmessage = onmsg
	}, {once: true})
}, {once: true})

gen.onclose = close

export const generator = (x, y, id) => new Promise(r => {
	waiting.push(r)
	gen.postMessage({x: x<<6, y: y<<6, d: id})
})
export const genMap = new Map()
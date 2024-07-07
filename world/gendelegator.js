import { blockindex } from '../blocks/index.js'
import { itemindex } from '../items/index.js'
import { entityindex } from '../entities/index.js'
import { stat } from './index.js'

const loaded = task('Loading WorldGen process...')
const gen = new Worker('./worldgen/genprocess.js')

const waiting = new Map()
let key = 0
gen.onmessage = function({data: a}){
	if(typeof a == 'string') throw '(from gen child process)\n'+a
	const {key, buf} = a
	if(key == -1) return loaded('WorldGen process loaded')
	else if(key == -2) return perf.addData(1,arguments[0])
	else if(key == -3) return gen.postMessage([blockindex, itemindex, entityindex])
	stat('world', 'chunks_generated')
	stat('world', 'chunk_revisits', -1)
	waiting.get(key)(buf)
	waiting.delete(key)
}
gen.onclose = close

export const generator = (x, y, gend, genn) => new Promise(r => {
	x = x << 6 >> 6; y = y << 6 >> 6
	waiting.set(key, r)
	gen.postMessage({x, y, d: gend, key, seed: CONFIG.world.seed, name: genn})
	key++
})
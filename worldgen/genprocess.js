import { Blocks, Items, Entities, ItemIDs, BlockIDs, EntityIDs, Biomes, Biome } from './globals.js'
import { setSeed, chunk } from './util/outer-noise.js'
import { jsonToType } from '../modules/dataproto.js'
import { cache, setGenerators } from './core.js'
import { _setPm, toBuf } from './util/chunk.js'

const {data: {indices, seed, generators}} = await new Promise(r => {
	parentPort.addEventListener('message', r, {once: true})
	parentPort.postMessage(null)
})


setSeed(seed)

let blockCount = 0, itemCount = 0, entityCount = 0
let i = 0
for(let a of indices[0].split('\n')){
	a = a.split(' ')
	const name = a.shift(); a = a.map(jsonToType)
	const savedata = a.pop()
	const f = savedata ? (data = {}) => {data.id=f.id;data.savedata=savedata;data.savedatahistory=a;return data} : () => f
	f.id = i++; f.savedata = savedata; f.savedatahistory = a
	BlockIDs.push(Blocks[name] = f)
	blockCount++
}
_setPm(i)
i = 0
for(let a of indices[1].split('\n')){
	a = a.split(' ')
	const name = a.shift(); a = a.map(jsonToType)
	const f = (count, data = {}) => (data.count=count,data.id=f.id,data.savedata=f.savedata,data.savedatahistory=a,data)
	f.id = i++; f.savedata = a.pop(); f.savedatahistory = a
	ItemIDs.push(Items[name] = f)
	itemCount++
}
i = 0
for(let a of indices[2].split('\n')){
	a = a.split(' ')
	const name = a.shift(); a = a.map(jsonToType)
	const f = (x, y, data = {}) => (data.x=x,data.y=y,data.id=f.id,data.savedata=f.savedata,data.savedatahistory=a,data)
	f.id = i++; f.savedata = a.pop(); f.savedatahistory = a
	EntityIDs.push(Entities[name] = f)
	entityCount
}
let q = []
parentPort.onmessage = e => q.push(e)

const p = import('./shapers.js')
await import('./biomes.js')
await p

for(const b of Object.values(Biomes)) if(b.id == -1) Biome.register([b])

setGenerators(generators)
chunk.fill(Blocks.air.id)
const emptyChunk = toBuf().build().buffer
parentPort.onmessage = ({data}) => {
	if('seed' in data){
		setSeed(data.seed)
		setGenerators(data.generators)
		return
	}
	const d = cache.get(data.d)
	if(!d) return void parentPort.postMessage(emptyChunk)
	try{ d.generate(data.x, data.y) }
	catch(e){ chunk.fill(Blocks.air.id); Promise.reject(e) }
	finally{
		const b = toBuf().build().buffer
		parentPort.postMessage(b, [b])
	}
}
parentPort.postMessage(null)
for(const m of q) parentPort.onmessage(m)
q = null

if(performance.nodeTiming){
	let idle2 = performance.nodeTiming.idleTime
	let time2 = performance.now()
	let threadUsage = 0
	setInterval(() => {
		const f = (idle2 - (idle2 = performance.nodeTiming.idleTime)) / (time2 - (time2 = performance.now()))
		threadUsage -= (threadUsage + f - 1) / 20
		parentPort.postMessage({elu: threadUsage, mem: process.memoryUsage().heapTotal})
	}, 500)
}
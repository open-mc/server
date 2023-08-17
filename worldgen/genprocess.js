import { fs, parentPort } from '../internals.js'
import { jsonToType } from 'dataproto'
import { air, Blocks, chunk, chunkBiomes, empty, Items, setSeed } from './vars.js'
parentPort?.on('message', async function({key, x, y, d, seed, name = 'default'}){
	if(name=='void'){
		air()
		parentPort.postMessage({key, buf: buildBuffer()})
		return
	}
	let D = GENERATORS[d]
	if(!D) D = GENERATORS[d] = Object.create(null), console.warn('\x1b[35mWorldGen\x1b[m >> \x1b[33mNo such dimension: "'+d+'"!')
	let gen = D[name]
	if(!gen){
		D[name] = air,
		air()
		parentPort.postMessage({key, buf: buildBuffer()})
		console.warn('\x1b[35mWorldGen\x1b[m >> \x1b[33mDimension "'+d+'" doesn\'t have a generator named "'+name+'"!')
	}else{
		setSeed(seed)
		const pr = gen(x, y)
		if(pr && pr.then) pr.then(() => parentPort.postMessage({key, buf: buildBuffer()}))
		else parentPort.postMessage({key, buf: buildBuffer()})
	}
})
let blockCount = 0, itemCount = 0
let i = 0
for(let a of (''+await fs.readFile(WORLD+'/defs/blockindex.txt')).split('\n')){
	a = a.split(' ')
	const def = {id: i++, savedata: jsonToType(a.length > 1 ? a.pop() : 'null')}
	const f = def.savedata ? (data = {}) => Object.assign(data, def) : () => def
	Object.assign(f, def)
	Blocks[a[0]] = f
	blockCount++
}
i = 0
for(let a of (''+await fs.readFile(WORLD+'/defs/itemindex.txt')).split('\n')){
	a = a.split(' ')
	const def = {id: i++, savedata: jsonToType(a.length > 1 ? a.pop() : 'null')}
	const f = (count, data = {}) => (data.count = count, Object.assign(data, def))
	Object.assign(f, def)
	Items[a[0]] = f
	itemCount++
}

const GENERATORS = Object.create(null)
const loaded = []
for(const gen of await fs.readdir(PATH + 'worldgen/dimensions'))
	loaded.push(import('./dimensions/'+gen).then(m => GENERATORS[gen.replace('.js','')] = {...m}))
await Promise.all(loaded)

empty.fill(Blocks.air)
air()

parentPort?.postMessage({key:-1})
const PM = new Uint16Array(blockCount).fill(65535)
function buildBuffer(){
	const palette = []
	for(let i = 0; i < 4096; i++){
		const id = chunk[i].id
		if(PM[id] === 65535){
			PM[id] = palette.length
			palette.push(id)
			if(palette.length == 1024) break
		}
	}
	let buf = new Uint8Array(15 + palette.length * 2)
	let buffers = [buf]
	buf[1] = palette.length-1 >> 8; buf[2] = palette.length-1
	buf[3] = buf[4] = 255
	buf.set(chunkBiomes, 5)
	if(palette.length < 1024)
		for(let i = 0; i < palette.length; i++) buf[15 + (i << 1)] = palette[i] >> 8, buf[16 + (i << 1)] = palette[i] 
	//encode data
	if(palette.length < 2);
	else if(palette.length == 2){
		buffers.push(buf = new Uint8Array(512))
		for(let i = 0; i < 4096; i+=8){
			buf[i>>3] = ((chunk[i].id == palette[1]) << 0)
			| ((chunk[i + 1].id == palette[1]) << 1)
			| ((chunk[i + 2].id == palette[1]) << 2)
			| ((chunk[i + 3].id == palette[1]) << 3)
			| ((chunk[i + 4].id == palette[1]) << 4)
			| ((chunk[i + 5].id == palette[1]) << 5)
			| ((chunk[i + 6].id == palette[1]) << 6)
			| ((chunk[i + 7].id == palette[1]) << 7)
		}
	}else if(palette.length <= 4){
		buffers.push(buf = new Uint8Array(1024))
		for(let i = 0; i < 4096; i+=4){
			buf[i>>2] = PM[chunk[i].id]
			| (PM[chunk[i + 1].id] << 2)
			| (PM[chunk[i + 2].id] << 4)
			| (PM[chunk[i + 3].id] << 6)
		}
	}else if(palette.length <= 16){
		buffers.push(buf = new Uint8Array(2048))
		for(let i = 0; i < 4096; i+=2){
			buf[i>>1] = PM[chunk[i].id]
			| (PM[chunk[i + 1].id] << 4)
		}
	}else if(palette.length <= 256){
		buffers.push(buf = new Uint8Array(4096))
		for(let i = 0; i < 4096; i++){
			buf[i] = PM[chunk[i].id]
		}
	}else if(palette.length < 1024){
		buffers.push(buf = new Uint8Array(6144))
		let j = 0
		for(let i = 0; i < 6144; i+=3, j+=2){
			buf[i] = PM[chunk[j].id]
			buf[i+2] = PM[chunk[j + 1].id]
			buf[i+1] = (PM[chunk[j].id] >> 8) | ((PM[chunk[j + 1].id] >> 4) & 0xF0)
		}
	}else for(let i = 0; i < 4096; i++){
		buf[i<<1] = chunk[i].id>>8
		buf[i<<1|1] = chunk[i].id
	}
	//save block entities
	/*for(let i = 0; i < 4096; i++){
		let type = chunk[i].savedata
		if(!type)continue
	}*/
	for(let i of palette) PM[i] = 65535

	let final = new Uint8Array(buffers.reduce((a, b) => a + b.byteLength, 0)), i = 0
	for(const b of buffers){
		final.set(b, i)
		i += b.byteLength
	}
	return final
}

let idle2 = performance.nodeTiming.idleTime
let time2 = performance.now()
export let threadUsage = 0
setInterval(() => {
	const f = (idle2 - (idle2 = performance.nodeTiming.idleTime)) / (time2 - (time2 = performance.now()))
	threadUsage -= (threadUsage + f - 1) / 20
	parentPort.postMessage({key:-2, elu: threadUsage, mem: process.memoryUsage().heapTotal})
}, 500)
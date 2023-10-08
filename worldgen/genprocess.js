import '../node/internals.js'
import { jsonToType } from '../modules/dataproto.js'
import { air, Blocks, chunk, chunkBiomes, empty, Items, Entities, setSeed } from './vars.js'

parentPort.postMessage({key:-3})
const indexes = await new Promise(r => parentPort.once('message', r))

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

let blockCount = 0, itemCount = 0, entityCount = 0
let i = 0
for(let a of indexes[0].split('\n')){
	a = a.split(' ')
	const name = a.shift(); a = a.map(jsonToType)
	const savedata = a.pop()
	const f = savedata ? (data = {}) => {data.id=f.id;data.savedata=savedata;data.savedatahistory=a;return data} : () => f
	f.id = i++; f.savedata = savedata; f.savedatahistory = a
	Blocks[name] = f
	blockCount++
}
i = 0
for(let a of indexes[1].split('\n')){
	a = a.split(' ')
	const name = a.shift(); a = a.map(jsonToType)
	const f = (count, data = {}) => (data.count=count,data.id=f.id,data.savedata=f.savedata,data.savedatahistory=a,data)
	f.id = i++; f.savedata = a.pop(); f.savedatahistory = a
	Items[name] = f
	itemCount++
}
i = 0
for(let a of indexes[2].split('\n')){
	a = a.split(' ')
	const name = a.shift(); a = a.map(jsonToType)
	const f = (x, y, data = {}) => (data.x=x,data.y=y,data.id=f.id,data.savedata=f.savedata,data.savedatahistory=a,data)
	f.id = i++; f.savedata = a.pop(); f.savedatahistory = a
	Entities[name] = f
	entityCount++
}

const GENERATORS = await import('./dimensions/index.js')

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
		}
		if(palette.length == 256){
			for(let i of palette) PM[i] = 65535
			palette.length = 0
			break
		}
	}
	let buf = new Uint8Array(14 + palette.length * 2)
	let buffers = [buf]
	buf[1] = palette.length-1
	buf[2] = buf[3] = 255
	buf.set(chunkBiomes, 4)
	if(palette.length < 1024)
		for(let i = 0; i < palette.length; i++) buf[14 + (i << 1)] = palette[i] >> 8, buf[15 + (i << 1)] = palette[i] 
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
	const bdata = new DataWriter()
	//save block entities
	for(let i = 0; i < 4096; i++){
		let b = chunk[i]
		if(!b.savedata)continue
		bdata.flint(b.savedatahistory.length)
		bdata.write(b.savedata, b)
	}
	buffers.push(bdata.build())
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
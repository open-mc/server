import { jsonToType } from '../modules/dataproto.js'
import { air, Blocks, chunk, chunkBiomes, empty, Items, Entities, setSeed } from './vars.js'

parentPort.postMessage({key:-3})
parentPort.addEventListener('message', async ({data: indexes}) => {
parentPort.onmessage = async function({key, x, y, d, seed, name = 'default'}){
	if(name=='void'){
		air()
		parentPort.postMessage({key, buf: buildBuffer()})
		return
	}
	let D = GENERATORS[d]
	if(!D) D = GENERATORS[d] = Object.create(null), console.warn('\x1b[35mWorldGen\x1b[m >> \x1b[33mNo such dimension: "'+d+'"!')
	let gen = D[name]
	if(!gen){
		D[name] = air
		air()
		parentPort.postMessage({key, buf: buildBuffer()})
		console.warn('\x1b[35mWorldGen\x1b[m >> \x1b[33mDimension "'+d+'" doesn\'t have a generator named "'+name+'"!')
	}else{
		setSeed(seed)
		const pr = gen(x, y)
		if(pr && pr.then) pr.then(() => parentPort.postMessage({key, buf: buildBuffer()}))
		else parentPort.postMessage({key, buf: buildBuffer()})
	}
}


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
parentPort.postMessage({key:-1})
const PM = new Uint16Array(blockCount).fill(0x0100)
const IDs = new Uint16Array(4096)
function buildBuffer(){
	const palette = [], paletteFull = []
	for(let i = 0; i < 4096; i++){
		const id = IDs[i] = chunk[i].id, a = PM[id]
		if(a < 0x0100) continue
		if(a > 0x0100){
			if(a < 0x010A){ PM[id] = a+1; continue }
			PM[id] = palette.push(id)-1
			if(palette.length+(palette.length!=paletteFull.length) == 256){ palette.length = 0; break }
		}else if(palette.length != 255) PM[id] = 0x0101, paletteFull.push(id)
		else{ palette.length = 0; break }
	}
	const buffers = []
	try{
		let lastId = -1
		for(const p of paletteFull)
			if(PM[p]>=0x0100) PM[p] = palette.length, lastId = 0
		if(!lastId) lastId = palette.push(65535) - 1
		let buf = new Uint8Array(16 + palette.length * 2)
		buffers.push(buf)
		buf[3] = palette.length - 1
		buf[4] = buf[5] = 255
		buf.set(chunkBiomes, 6)
		//encode palette
		for(let i = 0; i < palette.length; i++) buf[16 + (i << 1)] = palette[i] >> 8, buf[17 + (i << 1)] = palette[i]
		//encode data
		if(palette.length < 2);
		else if(palette.length == 2){
			buffers.push(buf = new Uint8Array(512))
			for(let i = 0; i < 4096; i+=8){
				buf[i>>3] = ((chunk[i].id == palette[1]) << 0)
				| ((IDs[i+1] == palette[1]) << 1)
				| ((IDs[i+2] == palette[1]) << 2)
				| ((IDs[i+3] == palette[1]) << 3)
				| ((IDs[i+4] == palette[1]) << 4)
				| ((IDs[i+5] == palette[1]) << 5)
				| ((IDs[i+6] == palette[1]) << 6)
				| ((IDs[i+7] == palette[1]) << 7)
			}
		}else if(palette.length <= 4){
			buffers.push(buf = new Uint8Array(1024))
			for(let i = 0; i < 4096; i+=4){
				buf[i>>2] = PM[IDs[i]]
				| (PM[IDs[i + 1]] << 2)
				| (PM[IDs[i + 2]] << 4)
				| (PM[IDs[i + 3]] << 6)
			}
		}else if(palette.length <= 16){
			buffers.push(buf = new Uint8Array(2048))
			for(let i = 0; i < 4096; i+=2){
				buf[i>>1] = PM[IDs[i]]
				| (PM[IDs[i + 1]] << 4)
			}
		}else if(palette.length < 256){
			buffers.push(buf = new Uint8Array(4096))
			for(let i = 0; i < 4096; i++){
				buf[i] = PM[IDs[i]]
			}
		}else for(let i = 0; i < 4096; i++){
			buffers.push(buf = new Uint8Array(8192))
			buf[i<<1] = IDs[i]>>8
			buf[i<<1|1] = IDs[i]
		}
		const bdata = new DataWriter()
		//save block entities
		for(let i = 0; i < 4096; i++){
			if(PM[IDs[i]] === lastId) bdata.short(IDs[i])
			const b = chunk[i]
			if(!b.savedata)continue
			bdata.flint(b.savedatahistory.length)
			bdata.write(b.savedata, b)
		}
		buffers.push(bdata.build())
	}finally{
		for(const p of paletteFull) PM[p] = 0x0100
	}
	const final = new Uint8Array(buffers.reduce((a, b) => a + b.byteLength, 0)); let i = 0
	for(const b of buffers){
		final.set(b, i)
		i += b.byteLength
	}
	return final
}

})

if(performance.nodeTiming){
	let idle2 = performance.nodeTiming.idleTime
	let time2 = performance.now()
	let threadUsage = 0
	setInterval(() => {
		const f = (idle2 - (idle2 = performance.nodeTiming.idleTime)) / (time2 - (time2 = performance.now()))
		threadUsage -= (threadUsage + f - 1) / 20
		parentPort.postMessage({key:-2, elu: threadUsage, mem: process.memoryUsage().heapTotal})
	}, 500)
}
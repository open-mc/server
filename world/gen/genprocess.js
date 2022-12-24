import fs from 'fs/promises'
import { parentPort } from 'worker_threads'
import { jsonToType } from '../../utils/data.js'
parentPort?.on('message', async function({x, y, d, seed, name = 'default'}){
	globalThis.seed = seed ^ 0xC0FFEBAD
	await (GENERATORS[d]?.[name]||dfgen)(x, y)
	parentPort.postMessage({key: x+' '+y+' '+d, buf: toPacket(x, y, chunk)})
})
async function all(o){for(let i in o)o[i]=await o[i];return o}
globalThis.PATH = decodeURI(import.meta.url).replace(/[^\/]*(\.js)?$/,"").replace('file://','')
globalThis.chunk = []
globalThis.chunkBiomes = new Uint8Array(10)
const path = decodeURI(import.meta.url).replace(/[^\/]*(\.js)?$/,"").replace('file://','')
globalThis.Blocks = Object.fromEntries((''+await fs.readFile(path + '../../../'+(process.argv[2]||'world')+'/defs/blockindex.txt')).split('\n').map((a, i) => [(a=a.split(" ")).shift(), ((obj, data = null) => data ? Object.assign(data, obj) : obj).bind(undefined, {id: i, savedata: jsonToType(a.pop()||'null')})]))
globalThis.Items = Object.fromEntries((''+await fs.readFile(path + '../../../'+(process.argv[2]||'world')+'/defs/itemindex.txt')).split('\n').map((a, i) => [(a=a.split(" ")).shift(), ((obj, data = null) => data ? Object.assign(data, obj) : obj).bind(undefined, {id: i, savedata: jsonToType(a.pop()||'null')})]))
for(let i = 0; i < 4096; i++)globalThis.chunk.push(Blocks.air())
const GENERATORS = await all({
	overworld: import('./overworld.js'),
	nether: import('./nether.js'),
})
let dfgen = (cx,cy)=>chunk.fill(Blocks.air())
Object.setPrototypeOf(GENERATORS, null)
parentPort && parentPort.postMessage({key: 'ready'})
function toPacket(x, y, tiles){
	let palette = [], palette2 = Object.create(null)
	for(let i = 0; i < 4096; i++){
		let id = tiles[i].id
		if(!(id in palette2)){
			palette2[id] = palette.length
			palette.push(id)
		}
	}
	let buf = new Uint8Array(21 + palette.length * 2), view = new DataView(buf.buffer)
	let buffers = [buf]
	buf[0] = 16
	view.setInt32(1, (x & 0x3ffffff) + ((palette.length-1) << 26))
	view.setInt32(5, (y & 0x3ffffff) + ((palette.length-1) >> 6 << 26))
	buf.set(chunkBiomes, 11)
	for(let i = 0; i < palette.length; i++) view.setUint16(21 + i * 2, palette[i])
	//encode data
	if(palette.length < 2);
	else if(palette.length == 2){
		buffers.push(buf = new Uint8Array(512))
		for(let i = 0; i < 4096; i+=8){
			buf[i>>3] = ((tiles[i].id == palette[1]) << 0)
			| ((tiles[i + 1].id == palette[1]) << 1)
			| ((tiles[i + 2].id == palette[1]) << 2)
			| ((tiles[i + 3].id == palette[1]) << 3)
			| ((tiles[i + 4].id == palette[1]) << 4)
			| ((tiles[i + 5].id == palette[1]) << 5)
			| ((tiles[i + 6].id == palette[1]) << 6)
			| ((tiles[i + 7].id == palette[1]) << 7)
		}
	}else if(palette.length <= 4){
		buffers.push(buf = new Uint8Array(1024))
		for(let i = 0; i < 4096; i+=4){
			buf[i>>2] = palette2[tiles[i].id]
			| (palette2[tiles[i + 1].id] << 2)
			| (palette2[tiles[i + 2].id] << 4)
			| (palette2[tiles[i + 3].id] << 6)
		}
	}else if(palette.length <= 16){
		buffers.push(buf = new Uint8Array(2048))
		for(let i = 0; i < 4096; i+=2){
			buf[i>>1] = palette2[tiles[i].id]
			| (palette2[tiles[i + 1].id] << 4)
		}
	}else if(palette.length <= 256){
		buffers.push(buf = new Uint8Array(4096))
		for(let i = 0; i < 4096; i++){
			buf[i] = palette2[tiles[i].id]
		}
	}else{
		buffers.push(buf = new Uint8Array(6144))
		let j = 0
		for(let i = 0; i < 6144; i+=3, j+=2){
			buf[i] = palette2[tiles[j].id]
			buf[i+2] = palette2[tiles[j + 1].id]
			buf[i+1] = (palette2[tiles[j].id] >> 8) | ((palette2[tiles[j + 1].id] >> 4) & 0xF0)
		}
	}
	//save block entities
	/*for(let i = 0; i < 4096; i++){
		let type = tiles[i]._._savedata
		if(!type)continue
	}*/
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
	parentPort.postMessage({key:'stat', elu: threadUsage, mem: process.memoryUsage().heapTotal})
}, 500)
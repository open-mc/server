import { fs, parentPort } from '../internals.js'
import { jsonToType } from '../utils/data.js'
import { Blocks, chunk, chunkBiomes, Items, setSeed } from './vars.js'
parentPort?.on('message', async function({key, x, y, d, seed, name = 'default'}){
	if(d == 'void') [d, name] = name.split('/', 2)
	let D = GENERATORS[d]
	if(!D) D = GENERATORS[d] = Object.create(null), console.warn('\x1b[35mWorldGen\x1b[m >> \x1b[33mNo such dimension: "'+d+'"!')
	let gen = D[name]
	if(!gen){
		gen = D[name] = () => void chunk.fill(Blocks.air),
		chunk.fill(Blocks.air)
		console.warn('\x1b[35mWorldGen\x1b[m >> \x1b[33mDimension "'+d+'" doesn\'t have a generator named "'+name+'"!')
	}else{
		setSeed(seed)
		const pr = gen(x, y)
		if(pr && pr.then) pr.then(() => parentPort.postMessage({key, buf: toPacket(x, y, chunk)}))
		else parentPort.postMessage({key, buf: toPacket(x, y, chunk)})
	}
})
let i = 0
for(let a of (''+await fs.readFile(WORLD+'/defs/blockindex.txt')).split('\n')){
	a = a.split(' ')
	const def = {id: i++, savedata: jsonToType(a.length > 1 ? a.pop() : 'null')}
	const f = def.savedata ? (data = {}) => Object.assign(data, def) : () => def
	Object.assign(f, def)
	Blocks[a[0]] = f
}
i = 0
for(let a of (''+await fs.readFile(WORLD+'/defs/itemindex.txt')).split('\n')){
	a = a.split(' ')
	const def = {id: i++, savedata: jsonToType(a.length > 1 ? a.pop() : 'null')}
	const f = (count, data = {}) => (data.count = count, Object.assign(data, def))
	Object.assign(f, def)
	Items[a[0]] = f
}

const GENERATORS = Object.create(null)
const loaded = []
for(const gen of await fs.readdir(PATH+'worldgen/dimensions'))
	loaded.push(import('./dimensions/'+gen).then(m => GENERATORS[gen.replace('.js','')] = m))
await Promise.all(loaded)
parentPort?.postMessage({key:-1})
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
		let type = tiles[i].savedata
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
	parentPort.postMessage({key:-2, elu: threadUsage, mem: process.memoryUsage().heapTotal})
}, 500)
import { promises as fs, exists, createReadStream, createWriteStream } from 'node:fs'
import { Worker, parentPort } from 'node:worker_threads'
import { PNG } from 'pngjs'
import fetch from 'node-fetch'
import { deflateSync, inflateSync } from 'node:zlib'

globalThis.fetch = fetch
export const PATH = decodeURI(import.meta.url).replace(/[^\/]*\/[^\/]*$/,"").replace(/file:\/\/\/?(\w+:\/)?/y,'/')
globalThis.PATH = PATH
globalThis.loadFile = (i, f) => (i=decodeURI(i.url).replace(/[^\/]*$/,"").replace(/file:\/\/\/?(\w+:\/)?/y,'/'), f ? fs.readFile(i + f) : f => fs.readFile(i + f))

globalThis.AsyncFunction = (async()=>{}).constructor

Object.defineProperties(Array.prototype, {
	best: {enumerable: false, value(pred, best = -Infinity){
		let el = undefined
		const length = this.length
		for(let i = 0; i < length; i++){
			const a = this[i], score = pred(a, i, this)
			if(score >= best) best = score, el = a
		}
		return el
	}},
	remove: {enumerable: false, value(a){
		let i = 0, j = 0
		for(; j < this.length; j++){
			if(j > i)this[i] = this[j]
			if(this[i] != a)i++
		}
		return this.length = i
	}},
	mutmap: {enumerable: false, value(fn){
		const len = this.length
		for(let i = 0; i < len; i++)
			this[i] = fn(this[i])
		return this
	}}
})

Math.ifloat = x => {
	const f = Math.floor(x)
	return (f | 0) + (x - f)
}
Math.randint = () => Math.random() * 4294967296 | 0
Math.ifloor = x => Math.floor(x) | 0
Math.iceil = x => Math.ceil(x) | 0

// Blazingly fast!!
const nul = new Array(100).fill(null)
Array.null = len => {
	if(len <= 100) return nul.slice(0, len)
	let a = new Array(len)
	while(len > 0) a[--len] = null
	return a
}

Date.formatTime = function(t){
	t /= 1000
	if(t < 3600){
		if(t >= 60) return floor(t/60)+'m '+floor(t%60)+'s'
		else if(t >= 1) return floor(t)+'s'
		else return t*1000+'ms'
	}else{
		if(t < 86400) return floor(t/3600)+'h '+floor(t%3600/60)+'m'
		else if(t < 8640000) return floor(t/86400)+'d '+floor(t%86400/3600)+'h'
		else return floor(t/86400)+'d'
	}
}

Object.defineProperties(globalThis, Object.getOwnPropertyDescriptors(Math))
globalThis.PI2 = PI*2

fs.exists = a => new Promise(r => exists(a, (a,b=a)=>r(b)))
fs.createReadStream = createReadStream
fs.createWriteStream = createWriteStream
globalThis.Worker = function(src){return new Worker(PATH+'node/internals.js', {argv: [src]})}
globalThis.parentPort = parentPort

import { getHeapStatistics } from 'node:v8'
Function.optimizeImmediately = Function.prototype
try{ Function.optimizeImmediately = new Function('...fns', 'for(const f of fns)%OptimizeFunctionOnNextCall(f)') }catch(e){}

export const argv = []
Object.setPrototypeOf(argv, null)

for(const opt of typeof Deno == 'undefined' ? process.argv.slice(2) : Deno.args){
	if(opt.startsWith('-')){
		const i = opt.indexOf('=')
		if(i < 0){
			argv[opt.slice(1+(opt[1]=='-'))] = true
		}else{
			const k = opt.slice(1+(opt[1]=='-'), i), v = opt.slice(i + 1)
			if(k==k>>>0) throw 'Invalid argument name: '+k
			const nv = +v
			argv[k] = nv == nv ? nv : v
		}
	}else if(opt) Array.prototype.push.call(argv, opt)
}

performance.nodeTiming ??= {idleTime: 0}

let idle2 = performance.nodeTiming.idleTime
let time2 = performance.now()

globalThis.perf = {elu: [0], mem: [0]}
Object.defineProperty(perf, 'addData', {value(key, obj){
	for(let k in perf){
		if(perf[k].length <= key) perf[k].length = key + 1
		perf[k][key] = obj[k]
	}
}, enumerable: false})
setInterval(() => {
	const f = (idle2 - (idle2 = performance.nodeTiming.idleTime)) / (time2 - (time2 = performance.now()))
	perf.elu[0] -= (perf.elu[0] + f - 1) / 20
	perf.mem[0] = getHeapStatistics().used_heap_size
}, 500)
function composeStat(a, v){
	const COLS = process.stdout.columns
	let val = 0, rval = 0, bar = '', i = false
	let col = v.reduce((a,b)=>a+1/max(0.01,1-b),0)/v.length
	col = col>3?1:(col>1.5?3:2)
	for(let a of v){
		val += a/v.length
		let repeat = -(rval - (rval = min(COLS,round(val * COLS))))
		if(!repeat)continue
		bar += '\x1b['+(i=!i?'10':'4')+col+'m'+' '.repeat(repeat)
	}
	bar += '\x1b[100m'+' '.repeat(COLS-rval)

	return a.join(' / ')+'\n'+bar+'\x1b[m'
}
const MEMLIMIT = getHeapStatistics().heap_size_limit
Object.defineProperty(perf,Symbol.for('nodejs.util.inspect.custom'), {value(){
	let s = [], a = [], v = []
	for(let i = 0; i < perf.elu.length; i++){
		const elu = perf.elu[i]
		a.push(`${i}: ${(elu*100).toFixed(1)}%`)
		v.push(elu)
	}
	s.push(composeStat(a, v))
	v = []
	let j = true
	for(let i = 0; i < perf.mem.length; i++){
		const mem = perf.mem[i]
		v.push(j ? mem / MEMLIMIT : mem / 4294967296)
		j = false
	}
	s.push(composeStat([`Mem: ${(v[0]*MEMLIMIT/1048576+v.slice(1).reduce((a,b)=>a+b,0)*4096).toFixed(1)}MB / ${round(MEMLIMIT / 104857.6 + (v.length-1)*40960)/10}MB`],v, ))
	return s.join('\n\n')
},enumerable:false})

if(!parentPort) fs.rm(PATH + 'node/.logs').catch(e=>null)

function uncaughtErr(e){
	console.error(e)
	e = e && (e.stack || e.message || e)
	if(!e) return
	if(!parentPort) fs.appendFile(PATH + 'node/.logs', e+'\n').catch(e=>console.log(e))
	else parentPort.postMessage(e+'')
	// https://discord.gg/NUUwFNUHkf
}
process.on('uncaughtException', uncaughtErr)
process.on('unhandledRejection', uncaughtErr)

let total = 0, loaded = 0
let resolvePromise = null
const _started = Date.now()
const print = parentPort ? _ => {} : desc => {
	console.log(`\x1b[32m[${Date.formatTime(Date.now() - _started)}] ${desc}`)
}
globalThis.task = function(desc = ''){
	total++
	let called = false
	return (d = desc) => {
		if(called) return
		called = true
		loaded++
		print(d)
		if(total == loaded && resolvePromise)resolvePromise(), resolvePromise = null
	}
}
task.done = desc => {
	total++; loaded++
	print(desc)
}
export const ready = { then: r => resolvePromise = r }

globalThis.started = 0
globalThis.host = ''

globalThis.PNG = {
	from: (i, src) => {
		const p = new PNG()
		fs.createReadStream(decodeURI(i.url).replace(/[^\/]*$/,"").replace(/file:\/\/\/?(\w+:\/)?/y,'/')+src).pipe(p)
		return new Promise((r,c)=>{p.once('parsed', ()=>r(p.data)); p.once('error', c)})
	},
	read: buf => {
		const p = new PNG()
		p.write(buf)
		p.end()
		return new Promise((r,c)=>{p.once('parsed', ()=>r(p.data)); p.once('error', c)})
	},
	write: (data, w, h) => {
		const p = new PNG({width: w, height: h})
		if(p.data.byteLength != data.byteLength) throw 'PNG width * height * 4 is not equal to typed array length'
		p.data = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
		let r
		const res = [], pr = new Promise(_r=>r=_r)
		p.pack().on('data', res.push.bind(res)).on('end', ()=>r(Buffer.concat(res)))
		return pr
	}
}

globalThis.deflate = str => {
	const b = deflateSync(typeof str == 'string' ? Buffer.from(str) : str)
	return new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
}
globalThis.inflate = str => {
	const b = inflateSync(typeof str == 'string' ? Buffer.from(str) : str)
	return new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
}

if(parentPort) import('../'+process.argv[2])
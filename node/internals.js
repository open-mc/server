import { promises as fs, exists, createReadStream, createWriteStream } from 'node:fs'
import { Worker, parentPort } from 'node:worker_threads'
import { PNG } from 'pngjs'
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
		let i = this.indexOf(a)
		if(i>-1){while(i<this.length)this[i]=this[++i];this.pop()}
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
const h = '0123456789abcdef'
Number.prototype.toHex = function(){return h[this>>>28]+h[this>>24&15]+h[this>>20&15]+h[this>>16&15]+h[this>>12&15]+h[this>>8&15]+h[this>>4&15]+h[this&15]}

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
const wFns = new WeakMap
const msgEv = new Event('message')
globalThis.Worker = class extends Worker{
	constructor(src){
		super(PATH+'node/internals.js', {argv: [src]})
		this._onmsg = null; this._oncl = null
		this.once('exit', err => this.emit('close', new CloseEvent('close', {reason: err})))
	}
	get onmessage(){return this._onmsg}
	get onclose(){return this._oncl}
	set onmessage(fn){
		if(this._onmsg) this.removeListener('message', wFns.get(this._onmsg))
		if(this._onmsg=fn){
			let f = wFns.get(fn)
			if(!f) wFns.set(fn, f=data=>(msgEv.data=data,fn(msgEv)))
			this.addListener('message', f)
		}
	}
	set onclose(fn){
		if(this._oncl) this.removeListener('close', this._oncl)
		if(this._oncl=fn) this.addListener('close', fn)
	}
	addEventListener(ev, fn, o){
		let e
		if(ev == 'message'){
			const f = fn; fn = wFns.get(fn)
			if(!fn) wFns.set(f, fn = o?.once ? data=>(msgEv.data=data,e?e():this.removeListener(ev, fn),f(msgEv)) : data=>(msgEv.data=data,f(msgEv)))
			this.addListener('message', fn)
		}else this.addListener(ev, o?.once ? (wFns.set(fn, fn = ev=>(e?e():this.removeListener(ev, fn),fn(ev))),fn) : fn)
		o.signal?.addEventListener('abort', e = () => (o.signal.removeEventListener('abort', e),this.removeListener(ev, fn)))
	}
	removeEventListener(ev, fn){ this.removeListener(ev, wFns.get(fn) ?? fn) }
}
globalThis.parentPort = parentPort

import { getHeapStatistics } from 'node:v8'
Function.optimizeImmediately = Function.prototype
try{ Function.optimizeImmediately = new Function('...fns', 'for(const f of fns)%OptimizeFunctionOnNextCall(f)') }catch{}

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
			argv[k] = v && nv == nv ? nv : v
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
		if(!repeat) continue
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

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

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
		if(total == loaded && resolvePromise) resolvePromise(), resolvePromise = null
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

globalThis.close = () => process.exit(0)

if(parentPort) import('../'+process.argv[2])
import { promises as fs, exists } from 'node:fs'
fs.exists = a => new Promise(r => exists(a, r))

export { Worker, parentPort } from 'node:worker_threads'
import { parentPort } from 'node:worker_threads'
export { fs }

import './utils/prototypes.js'

import { setFlagsFromString, getHeapStatistics } from 'node:v8'
import { runInThisContext } from 'node:vm'
export let optimize = Function.prototype
try{
	setFlagsFromString('--allow-natives-syntax')
	// TODO: research on %CompileOptimized_Concurrent
	optimize = new Function('...fns', 'for(const f of fns)%OptimizeFunctionOnNextCall(f)')
}catch(e){}

export const argv = []
Object.setPrototypeOf(argv, null)

for(const opt of typeof Deno == 'undefined' ? process.argv.slice(2) : Deno.args){
	if(opt.startsWith('-')){
		const i = opt.indexOf('=')
		if(i < 0){
			argv[opt.slice(1)] = true
		}else{
			const k = opt.slice(1, i), v = opt.slice(i + 1)
			if(k==k>>>0) throw 'Invalid argument name: '+k
			const nv = +v
			argv[k] = nv == nv ? nv : v
		}
	}else if(opt) Array.prototype.push.call(argv, opt)
}

globalThis.PATH = decodeURI(import.meta.url).replace(/[^\/]*$/,"").replace(/file:\/\/(\w+:\/)?/y,'')
globalThis.WORLD = argv[0] || PATH + '../world/'
if(!WORLD.endsWith('/')) WORLD += '/'

performance.nodeTiming ??= {idleTime: 0}

let idle2 = performance.nodeTiming.idleTime
let time2 = performance.now()

export let stats = {elu: [0], mem: [0]}
export function gotStats(key, obj){
	for(let k in stats){
		if(stats[k].length <= key) stats[k].length = key + 1
		stats[k][key] = obj[k]
	}
}
setInterval(() => {
	const f = (idle2 - (idle2 = performance.nodeTiming.idleTime)) / (time2 - (time2 = performance.now()))
	stats.elu[0] -= (stats.elu[0] + f - 1) / 20
	stats.mem[0] = getHeapStatistics().used_heap_size
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
export const MEMLIMIT = getHeapStatistics().heap_size_limit
Object.defineProperty(stats,Symbol.for('nodejs.util.inspect.custom'), {value(){
	let s = [], a = [], v = []
	for(let i = 0; i < stats.elu.length; i++){
		const elu = stats.elu[i]
		a.push(`${i}: ${(elu*100).toFixed(1)}%`)
		v.push(elu)
	}
	s.push(composeStat(a, v))
	v = []
	let j = true
	for(let i = 0; i < stats.mem.length; i++){
		const mem = stats.mem[i]
		v.push(j ? mem / MEMLIMIT : mem / 4294967296)
		j = false
	}
	s.push(composeStat([`Mem: ${(v[0]*MEMLIMIT/1048576+v.slice(1).reduce((a,b)=>a+b,0)*4096).toFixed(1)}MB / ${round(MEMLIMIT / 104857.6 + (v.length-1)*40960)/10}MB`],v, ))
	return s.join('\n\n')
},enumerable:false})

runInThisContext((_=>{

const { abs, min, max, floor, ceil, round, random, PI, PI2 = PI * 2, sin, cos, tan, sqrt, ifloat } = Math
const Object = globalThis.Object

const assert = condition => {
	if(condition) return
	console.error(new Error().stack.replace(/Error.*\n.*\n/, 'Assertion failed\n'))
}

}).toString().slice(6,-3))

if(!('abs' in globalThis))
	Object.defineProperties(globalThis, Object.getOwnPropertyDescriptors(Math))

function uncaughtErr(e){
	const l = process.stdout.columns
	console.log('\n\x1b[31m'+'='.repeat(max(0,floor(l / 2 - 8)))+' Critical Error '+'='.repeat(max(0,ceil(l / 2 - 8)))+'\x1b[m\n\n' 
		+ (e && (e.stack || e.message || e)) + '\n\x1b[31m'+'='.repeat(l)+'\n' + ' '.repeat(max(0,floor(l / 2 - 28))) + 'Join our discord for help: https://discord.gg/NUUwFNUHkf')
	process.exit(0)
}
process.on('uncaughtException', uncaughtErr)
process.on('unhandledRejection', uncaughtErr)

let total = 0, loaded = 0
let resolvePromise = null
const started = Date.now()
const print = desc => parentPort || console.log(
	`\x1b[1A\x1b[9999D\x1b[2K\x1b[32m[${'#'.repeat(loaded)+' '.repeat(total - loaded)}] (${Date.formatTime(Date.now() - started)}) ${desc}`
)
globalThis.task = function(desc = ''){
	total++
	let called = false
	print(desc)
	return (desc) => {
		if(called) return
		called = true
		loaded++
		print(desc)
		if(total == loaded && resolvePromise)resolvePromise(), resolvePromise = null
	}
}
task.done = desc => {
	total++; loaded++
	print(desc)
}
export const ready = {then(r){
	resolvePromise = r
}}
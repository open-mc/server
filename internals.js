import { promises as fs, exists } from 'node:fs'
fs.exists = a => new Promise(r => exists(a, r))

export { Worker } from 'node:worker_threads'
export { fs }

import { setFlagsFromString, getHeapStatistics } from 'node:v8'
import './utils/prototypes.js'
import { runInThisContext } from 'node:vm'
import './utils/prototypes.js'
export let optimize = Function.prototype
try{
	setFlagsFromString('--allow-natives-syntax')
	// TODO: research on %CompileOptimized_Concurrent
	optimize = new Function('...fns', 'for(const f of fns)%OptimizeFunctionOnNextCall(f)')
}catch(e){}

globalThis.PATH = decodeURI(import.meta.url).replace(/[^\/]*(\.js)?$/,"").replace(/file:\/\/(\w+:\/)?/y,'')
globalThis.WORLD = PATH + '../' + ((typeof Deno == 'undefined' ? process.argv[2] : Deno.args[0]) || 'world') + '/'

if(!await fs.exists(WORLD)){
	await fs.mkdir(WORLD)
	await Promise.all([
		fs.mkdir(WORLD + 'players'),
		fs.mkdir(WORLD + 'dimensions'),
		fs.mkdir(WORLD + 'defs').then(() => Promise.all([
			fs.writeFile(WORLD + 'defs/blockindex.txt', 'air'),
			fs.writeFile(WORLD + 'defs/itemindex.txt', 'stone'),
			fs.writeFile(WORLD + 'defs/entityindex.txt', 'player {}')
		])),
		fs.writeFile(WORLD + 'permissions.yaml', `# permission settings
# possible permissions: op, mod, normal, spectate, deny, banned(ban_end)

# "Spectate" players may move around, load chunks and see the world
# but cannot place, break or otherwise interact with the world.
# They are also not visible to other players, but do show up /list

# Example permissions (without the #):
# cyarty: op
# zekiah: mod

default_permissions: normal`),
		fs.writeFile(WORLD + 'gamerules.json', '{}'),
		fs.copyFile(PATH + 'default_properties.yaml', WORLD + 'properties.yaml')
	])
}

performance.nodeTiming ??= {idleTime: 0}

let idle2 = performance.nodeTiming.idleTime
let time2 = performance.now()

export let stats = {elu: {cpu1: 0}, mem: {cpu1: 0}}
export function gotStats(key, obj){
	for(let k in stats){
		stats[k][key] = obj[k]
	}
}
setInterval(() => {
	const f = (idle2 - (idle2 = performance.nodeTiming.idleTime)) / (time2 - (time2 = performance.now()))
	stats.elu.cpu1 -= (stats.elu.cpu1 + f - 1) / 20
	stats.mem.cpu1 = getHeapStatistics().used_heap_size
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
	for(const k in stats.elu){
		const elu = stats.elu[k]
		a.push(`${k}: ${(elu*100).toFixed(1)}%`)
		v.push(elu)
	}
	s.push(composeStat(a, v))
	v = []
	let j = true
	for(const k in stats.mem){
		const mem = stats.mem[k]
		v.push(j ? mem / MEMLIMIT : mem / 4294967296)
		j = false
	}
	s.push(composeStat([`Mem: ${(v[0]*MEMLIMIT/1048576+v.slice(1).reduce((a,b)=>a+b,0)*4096).toFixed(1)}MB / ${round(MEMLIMIT / 104857.6 + (v.length-1)*40960)/10}MB`],v, ))
	return s.join('\n\n')
},enumerable:false})

runInThisContext((_=>{

const { abs, min, max, floor, ceil, round, random, PI, PI2 = PI * 2, sin, cos, tan, sqrt, ifloat } = Math
const Object = globalThis.Object

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
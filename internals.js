const get = typeof process == 'undefined' ? a => import('Zpolyfills/'+a+'.js') : a => import(a);


/*
import { setFlagsFromString } from 'v8'
setFlagsFromString('--allow-natives-syntax')
//*/
import fse from 'fs-extra'
import {promises as fs, exists} from 'fs'
globalThis.PATH = decodeURI(import.meta.url).replace(/[^\/]*(\.js)?$/,"").replace('file://','')
globalThis.WORLD = PATH + '../' + (process.argv[2] || 'world') + '/'

fs.exists = a => new Promise(r => exists(a, r))

await fs.readdir(WORLD).catch(e=>fse.copy(PATH + 'template_world_folder_do_not_edit', WORLD))
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
	stats.mem.cpu1 = process.memoryUsage().heapTotal
}, 500)
function composeStat(a, v){
	const COLS = process.stdout.columns
	let val = 0, rval = 0, bar = '', i = false
	let col = v.reduce((a,b)=>a+1/Math.max(0.01,1-b),0)/v.length
	col = col>3?1:(col>1.5?3:2)
	for(let a of v){
		val += a/v.length
		let repeat = -(rval - (rval = Math.min(COLS,Math.round(val * COLS))))
		if(!repeat)continue
		bar += '\x1b['+(i=!i?'10':'4')+col+'m'+' '.repeat(repeat)
	}
	bar += '\x1b[100m'+' '.repeat(COLS-rval)

	return a.join(' / ')+'\n'+bar+'\x1b[m'
}
export const MEMLIMIT = +(process.execArgv.find(a=>a.startsWith('--max-old-space-size='))||'=4096').split('=')[1] * 1048576
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
	s.push(composeStat([`Mem: ${(v[0]*MEMLIMIT/1048576+v.slice(1).reduce((a,b)=>a+b,0)*4096).toFixed(1)}MB / ${Math.round(MEMLIMIT / 104857.6 + (v.length-1)*40960)/10}MB`],v, ))
	return s.join('\n\n')
},enumerable:false})
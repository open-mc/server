import fs from 'fs/promises'
import { argv } from './internals.js'
import { parse } from 'yaml'
import lvl, { ClassicLevel } from 'classic-level'
const Level = lvl.ClassicLevel
globalThis.CONFIG = null
globalThis.configLoaded = fn => configLoaded.listeners.push(fn)
configLoaded.listeners = []
globalThis.httpHost = ''
if(!argv.length) argv[0] = PATH + '../properties.yaml'
Array.prototype.push.call(argv, PATH + 'node/default_properties.yaml')
function argvConfig(){
	const o = {}
	for(let i in argv){
		let v = argv[i]
		if(i.endsWith('[]')) i = i.slice(0, -2), v = v === true ? [] : new Array(v).fill(null)
		const path = i.split('.')
		const k = path.pop()
		path.reduce((a,b)=>a[b]??={},o)[k] = v
	}
	return o
}
function fallback(o, f){
	for(const k in f){
		if(k in o){
			if(typeof f[k] == 'object') fallback(o[k], f[k])
		}else o[k] = f[k]
	}
	return o
}
const resolve = (f, p) => !p || p[0] == '/' || p[0] == '~' ? p : f + p
async function loadConfigs(i){
	if(i)console.info("Reloading config...")
	const p = CONFIG && CONFIG.path
	const promises = []
	for(let i = 0; i < argv.length; i++){
		const p = argv[i]// = resolve(PATH, argv[i])
		const f = p.slice(0, p.lastIndexOf('/')+1)
		promises.push(fs.readFile(p).catch(e=>fs.readFile(PATH+'node/default_properties.yaml').then(buf=>(fs.writeFile(p,buf).catch(e=>null),buf))).then(a => {
			const v = parse(a.toString())
			if('path' in v) v.path = resolve(f, v.path)
			if('key' in v) v.key = resolve(f, v.key)
			if('cert' in v) v.cert = resolve(f, v.cert)
			return v
		}))
	}
	const C = (await Promise.all(promises)).reduce(fallback, argvConfig())
	if(!C.port | !C.world) throw 'Invalid config file(s)'
	CONFIG = C
	if(p && CONFIG.path != p) console.warn('To change world save path, reload the server')
	for(const f of configLoaded.listeners) try{f(CONFIG)}catch(e){console.error(e)}
}
for(let i = 0; i < argv.length; i++){
	const w2 = fs.watch(argv[i])[Symbol.asyncIterator]()
	w2.next().then(function S(){ loadConfigs(true); w2.next().then(S) }).catch(e=>null)
}
class VolatileLevel extends Map{
	sublevels = new Map
	sublevel(a){let s=this.sublevels.get(a);if(!s)this.sublevels.set(a,s=new VolatileLevel);return s}
	batch(a){
		for(const {type, key, value} of a){
			if(type == 'put') this.set(key, value)
			else if(type == 'del') this.delete(key)
			else throw "A batch operation must have a type property that is 'put' or 'del'"
		}
		return Promise.resolve()
	}
	get(a,cb){const v = super.get(a); if(v)return cb?void cb(null,v):Promise.resolve(v); else return cb?void cb('Not Found:',null):Promise.reject('Not Found:')}
	put(a,b,cb){this.set(a,b);return cb?void cb():Promise.resolve()}
	del(a,cb){this.delete(a);return cb?void cb():Promise.resolve()}
	open(cb){return cb?void cb():Promise.resolve()}
	close(cb){console.warn('Temporary map, deleting all '+this.totalSize+' saved entries');return cb?void cb():Promise.resolve()}
	get totalSize(){
		let t = this.size
		for(const s of this.sublevels.values()) t += s.totalSize
		return t
	}
}
void([globalThis.version] = await Promise.all([
	fs.readFile(PATH + 'package.json').then(a=>JSON.parse(a+'').version),
	loadConfigs(false).then(() => {
		globalThis.DB = CONFIG.path ? new ClassicLevel(CONFIG.path) : new VolatileLevel()
		if(!CONFIG.path) console.warn('No world path! (Running on temporary map, will not save to disk)')
		return DB.open()
	})
]))

import { ready } from './internals.js'
const {default: openServer} = await import('./server.js')
await ready
task.done('Modules loaded')
if(CONFIG.manual){
	console.log('\x1b[mPress enter to start server')
	await new Promise(r => process.stdin.once('data', r))
}
openServer()
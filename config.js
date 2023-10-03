import { fs,  } from './internals.js'
import { parse } from 'yaml'
import { Level } from 'level'

export let CONFIG

const w2 = fs.watch(PATH + "properties.yaml")[Symbol.asyncIterator]()

function clone(o){
	if(Array.isArray(o)) return o.map(clone)
	else if(o && typeof o === 'object'){
		o = {...o}
		for(const k in o) o[k] = clone(o[k])
	}
	return o
}

async function loadConfig(a){
	if(a)console.info("Reloading config...")
	const p = CONFIG && CONFIG.path
	try{ CONFIG = parse(await fs.readFile(PATH + "properties.yaml").then(a => a.toString())) }catch(e){}
	if(p && CONFIG.path != p) console.warn('To change world save path, reload the server')
	w2.next().then(loadConfig)
}

export const DEFAULT_TPS = 20

export const json = a => JSON.parse(''+a)
export const filesLoaded = task('Loading config files')
await loadConfig()
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
export const DB = CONFIG.path ? new Level(CONFIG.path[0] == '/' || CONFIG.path[0] == '~' ? CONFIG.path : PATH + CONFIG.path) : new VolatileLevel()
if(!CONFIG.path) console.warn('No world path! (Running on temporary map, will not save to disk)')
await DB.open()

export const [
	GAMERULES,
	STATS,
	{ version }
] = await Promise.all([
	DB.get('gamerules').then(json).catch(e=>({})),
	DB.get('stats').then(json).catch(e=>({})),
	fs.readFile(PATH + 'package.json').then(json),
])

GAMERULES.commandlogs ??= true
GAMERULES.spawnx ??= 0
GAMERULES.spawny ??= 18
GAMERULES.spawnworld ??= 'overworld'
GAMERULES.randomtickspeed ??= 2
GAMERULES.globalevents ??= true
GAMERULES.keepinventory ??= false
GAMERULES.mobloot ??= true

export function stat(cat, name, v = 1){
	const o = STATS[cat] ?? (STATS[cat] = {[name]: 0})
	return o[name] = (o[name] ?? 0) + v
}
export function statAvg(cat, name, v, lower = 0){
	const countProp = name + '_count'
	const o = STATS[cat] ?? (STATS[cat] = {[name]: 0, [countProp]: 0})
	const count = 1 / (o[countProp] = (o[countProp] ?? 0) + 1)
	return o[name] = (o[name] ?? 0) * (1 - count) + v * count
}
export function statRecord(cat, name, v){
	const o = STATS[cat] ?? (STATS[cat] = {[name]: 0})
	return o[name] = max(o[name] ?? 0, v)
}
export function setStat(cat, name, v){
	const o = STATS[cat] ?? (STATS[cat] = {[name]: 0})
	return o[name] = (o[name] ?? 0) + v
}
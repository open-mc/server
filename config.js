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
export const DB = new Level(CONFIG.path[0] == '/' || CONFIG.path[0] == '~' ? CONFIG.path : PATH + CONFIG.path)
await DB.open()

export const [
	GAMERULES,
	STATS,
	{ version },
	packs
] = await Promise.all([
	DB.get('gamerules').then(json).catch(e=>({})),
	DB.get('stats').then(json).catch(e=>({})),
	fs.readFile(PATH + 'package.json').then(json),
	fs.readFile(PATH + 'packs.json').then(json),
])

GAMERULES.commandlogs ??= true
GAMERULES.spawnx ??= 0
GAMERULES.spawny ??= 20
GAMERULES.spawnworld ??= 'overworld'
GAMERULES.randomtickspeed ??= 2
GAMERULES.globalevents ??= true
GAMERULES.keepinventory ??= false
GAMERULES.mobloot ??= true

export function stat(cat, name, v = 1){
	const o = STATS[cat] ?? (STATS[cat] = {[name]: 0})
	return o[name] = (o[name] ?? 0) + v
}
export function statAvg(cat, name, v){
	const countProp = name + '_count'
	const o = STATS[cat] ?? (STATS[cat] = {[name]: 0, [countProp]: 0})
	const count = 1 / (o[countProp] = (o[countProp] ?? 0) + 1)
	return o[name] = ((o[name] ?? 0) + v * count) / (1 + count)
}
export function statRecord(cat, name, v){
	const o = STATS[cat] ?? (STATS[cat] = {[name]: 0})
	return o[name] = max(o[name] ?? 0, v)
}
export function setStat(cat, name, v){
	const o = STATS[cat] ?? (STATS[cat] = {[name]: 0})
	return o[name] = (o[name] ?? 0) + v
}
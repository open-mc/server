import { fs } from './internals.js'
import { parse } from 'yaml'

export let CONFIG

export const DB = {
	//settings for custom databases
	LOADFILE: path => fs.readFile(WORLD + path).then(a => a ? new DataReader(a) : null),
	SAVEFILE: (path, data) => fs.writeFile(WORLD + path, data)
}

const w2 = fs.watch(WORLD + "properties.yaml")
const defaultConfig = parse(await fs.readFile(PATH + ".default_properties.yaml").then(a => a.toString()))

function clone(o){
	if(Array.isArray(o)) return o.map(clone)
	else if(o && typeof o === 'object'){
		o = {...o}
		for(const k in o) o[k] = clone(o[k])
	}
	return o
}

function fallback(o, f){
	for(const k in f){
		if(k in o){
			if(typeof f[k] == 'object') fallback(o[k], f[k])
		}else o[k] = clone(f[k])
	}
}

async function loadConfig(a){
	if(a)console.log("Reloading config...")
	try{
		CONFIG = parse(await fs.readFile(WORLD + "properties.yaml").then(a => a.toString()))
		fallback(CONFIG, defaultConfig)
	}catch(e){}
	w2.next().then(loadConfig)
}

export const DEFAULT_TPS = 20

if(!await fs.exists(WORLD)){
	await fs.mkdir(WORLD)
	await Promise.all([
		fs.mkdir(WORLD + 'players'),
		fs.mkdir(WORLD + 'dimensions'),
		fs.mkdir(WORLD + 'defs').then(() => Promise.all([
			DB.SAVEFILE('defs/blockindex.txt', 'air'),
			DB.SAVEFILE('defs/itemindex.txt', 'stone'),
			DB.SAVEFILE('defs/entityindex.txt', 'player {}'),
			DB.SAVEFILE('defs/misc.txt', '{}')
		])),
		DB.SAVEFILE('stats.json', `{}`),
		DB.SAVEFILE('permissions.json', `{"":2}`),
		DB.SAVEFILE('gamerules.json', '{}'),
		fs.copyFile(PATH + '.default_properties.yaml', WORLD + 'properties.yaml')
	])
}

const json = a => JSON.parse(''+a)
export const filesLoaded = task('Loading config files')
export const [
	GAMERULES,
	STATS,
	{ version },
	packs
] = await Promise.all([
	fs.readFile(WORLD + "gamerules.json").then(json).catch(e=>({})),
	fs.readFile(WORLD + "stats.json").then(json).catch(e=>({})),
	fs.readFile(PATH + "package.json").then(json),
	fs.readFile(PATH + "packs.json").then(json),
	loadConfig()
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
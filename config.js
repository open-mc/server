import { fs } from './internals.js'
import { parse } from 'yaml'

const perms = {op: 4, mod: 3, normal: 2, spectate: 1, deny: 0}
export const OP = 4, MOD = 3, NORMAL = 2, SPECTATE = 1
export let CONFIG
export let PERMISSIONS
const w = fs.watch(WORLD + "permissions.yaml")
async function loadPermissions(){
	try{
		PERMISSIONS = parse(await fs.readFile(WORLD + "permissions.yaml").then(a => a.toString()).catch(e=>'default_permissions: normal'))
		for(let i in PERMISSIONS){
			let str = PERMISSIONS[i]
			PERMISSIONS[i] = (perms[str.toLowerCase()] + 1 || 9) - 1
			str = str.match(/^banned(\(([^\)]*)\))?$/)
			if(str) PERMISSIONS[i] = round(new Date(str[2]) / 1000) || 2147483647
		}
	}catch(e){PERMISSIONS={};console.warn(e+'\n\n\n')}
	w.next().then(loadPermissions)
}


const w2 = fs.watch(WORLD + "properties.yaml")
const defaultConfig = parse(await fs.readFile(PATH + "default_properties.yaml").then(a => a.toString()))

function clone(o){
	if(Array.isArray(o)) return o.map(clone)
	else if(typeof o === 'object'){
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

export const HANDLERS = {
	//settings for custom databases
	LOADFILE: path => fs.readFile(WORLD + path).reader(),
	SAVEFILE: (path, data) => fs.writeFile(WORLD + path, data)
}
export const DEFAULT_TPS = 20

if(!await fs.exists(WORLD)){
	await fs.mkdir(WORLD)
	await Promise.all([
		fs.mkdir(WORLD + 'players'),
		fs.mkdir(WORLD + 'dimensions'),
		fs.mkdir(WORLD + 'defs').then(() => Promise.all([
			fs.writeFile(WORLD + 'defs/blockindex.txt', 'air'),
			fs.writeFile(WORLD + 'defs/itemindex.txt', 'stone'),
			fs.writeFile(WORLD + 'defs/entityindex.txt', 'player {}'),
			fs.writeFile(WORLD + 'defs/miscindex.txt', '{}')
		])),
		fs.writeFile(WORLD + 'stats.json', `{}`),
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

const json = a => JSON.parse(''+a)
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
	loadConfig(), loadPermissions()
])
GAMERULES.commandlogs ??= true
GAMERULES.spawnx ??= 0
GAMERULES.spawny ??= 20
GAMERULES.spawnworld ??= 'overworld'
GAMERULES.randomtickspeed ??= 2

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
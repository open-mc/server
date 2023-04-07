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
async function loadConfig(a){
	if(a)console.log("Reloading config...")
	try{ CONFIG = parse(await fs.readFile(WORLD + "properties.yaml").then(a => a.toString())) }catch(e){}
	w2.next().then(loadConfig)
}

export const HANDLERS = {
	//settings for custom databases
	LOADFILE: path => fs.readFile(WORLD + path).reader(),
	SAVEFILE: (path, data) => fs.writeFile(WORLD + path, data)
}
export const DEFAULT_TPS = 20

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
GAMERULES.spawnX ??= 0
GAMERULES.spawnY ??= 20
GAMERULES.spawnWorld ??= 'overworld'

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
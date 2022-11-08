import { fs } from './internals.js'
import { parse } from 'yaml'
const perms = {op: 4, mod: 3, normal: 2, spectate: 1, deny: 0}
export const OP = 4, MOD = 3, NORMAL = 2, SPECTATE = 1
export const CONFIG = parse(await fs.readFile(WORLD + 'properties.yaml').then(a => a.toString()))
export const PERMISSIONS = parse(await fs.readFile(WORLD + 'permissions.yaml').then(a => a.toString()))
for(let i in PERMISSIONS){
	let str = PERMISSIONS[i]
	PERMISSIONS[i] = (perms[str.toLowerCase()] + 1 || 9) - 1
	str = str.match(/^banned(\(([^\)]*)\))?$/)
	if(str) PERMISSIONS[i] = Math.round(new Date(str[2]) / 1000) || 2147483647
}
export const HANDLERS = {
	//settings for custom databases
	LOADFILE: p => fs.readFile(WORLD + p).reader(),
	SAVEFILE: (p, data) => fs.writeFile(WORLD + p, data)
}
export const TPS = 20

export const GAMERULES = JSON.parse(''+await fs.readFile(WORLD + 'gamerules.json'))
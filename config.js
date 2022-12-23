import { fs } from './internals.js'
import { parse } from 'yaml'
const perms = {op: 4, mod: 3, normal: 2, spectate: 1, deny: 0}
export const OP = 4, MOD = 3, NORMAL = 2, SPECTATE = 1
export const CONFIG = parse(await fs.readFile(WORLD + 'properties.yaml').then(a => a.toString()))
export let PERMISSIONS
const w = fs.watch(WORLD + 'permissions.yaml')
async function loadPermissions(){
	PERMISSIONS = parse(await fs.readFile(WORLD + 'permissions.yaml').then(a => a.toString()))
	for(let i in PERMISSIONS){
		let str = PERMISSIONS[i]
		PERMISSIONS[i] = (perms[str.toLowerCase()] + 1 || 9) - 1
		str = str.match(/^banned(\(([^\)]*)\))?$/)
		if(str) PERMISSIONS[i] = Math.round(new Date(str[2]) / 1000) || 2147483647
	}
	w.next().then(loadPermissions)
}
loadPermissions()

export const HANDLERS = {
	//settings for custom databases
	LOADFILE: path => fs.readFile(WORLD + path).reader(),
	SAVEFILE: (path, data) => fs.writeFile(WORLD + path, data)
}
export const TPS = 20

export const GAMERULES = JSON.parse(''+await fs.readFile(WORLD + 'gamerules.json'))

export const { version } = await fs.readFile('./package.json').then(a=>JSON.parse(''+a))
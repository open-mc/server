import { World } from './world.js'
import { fs } from '../internals.js'
import { filesLoaded } from '../config.js'
import { parse } from 'yaml'
export const Dimensions = {
	overworld: new World('overworld'),
	nether: new World('nether'),
	end: new World('end'),
	void: new World('void')
}
Object.setPrototypeOf(Dimensions, null)
const dimCreate = []
for(let i in Dimensions){
	let d = Dimensions[i]
	dimCreate.push(fs.readFile(WORLD + 'dimensions/' + d.id + '/meta').then(a => {
		const buf = new DataReader(a)
		return buf.read(d.constructor.savedatahistory[buf.flint()] || d.constructor.savedata, d)
	}).catch(e => null))
	dimCreate.push(fs.exists(WORLD + 'dimensions/' + d.id).then(a => a || fs.mkdir(WORLD + 'dimensions/' + d.id)))
}
await Promise.all(dimCreate)
export const allDimensions = Object.values(Dimensions)

export const players = new Map()
players[Symbol.for('nodejs.util.inspect.custom')] = function(){
	let a = '\x1b[32m' + this.size + '\x1b[m player'+(this.size==1?'':'s')+':'
	for(let pl of this){
		a += '\n' + pl[1]
	}
	return a
}

const perms = {op: 4, mod: 3, normal: 2, spectate: 1, deny: 0}
export const OP = 4, MOD = 3, NORMAL = 2, SPECTATE = 1
export let PERMISSIONS
const w = fs.watch(WORLD + "permissions.yaml")
async function loadPermissions(){
	try{
		PERMISSIONS = parse(await fs.readFile(WORLD + "permissions.yaml").then(a => a.toString()).catch(e=>'default_permissions: normal'))
		Object.setPrototypeOf(PERMISSIONS, null)
		for(let i in PERMISSIONS){
			let str = PERMISSIONS[i], perm
			str = str.match(/^banned(?:\(([^\)]*)\))?$/)
			if(str) perm = PERMISSIONS[i] = round(new Date(str[1]) / 1000) || 2147483647
			else perm = PERMISSIONS[i] = (perms[PERMISSIONS[i].toLowerCase()] + 1 || 9) - 1
			const pl = players.get(i)
			if(!pl) continue
			if(perm*1000 > Date.now()){
				pl.sock.send('-119You have been banned from this server'), pl.sock.close()
			}else pl.sock.permissions = perm, pl.rubber(0)
		}
	}catch(e){PERMISSIONS={};console.warn(e+'\n\n\n')}
	w.next().then(loadPermissions)
}
loadPermissions().then(filesLoaded)
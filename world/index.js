export const Dimensions = {}
Object.setPrototypeOf(Dimensions, null)

export const players = new Map()

export const OP = 4, MOD = 3, NORMAL = 2, SPECTATE = 1

const filesLoaded = task('Loading files')
const json = a => JSON.parse(''+a)
export const [
	GAMERULES,
	STATS,
	PERMISSIONS
] = await Promise.all([
	DB.get('gamerules').then(json).catch(e=>({})),
	DB.get('stats').then(json).catch(e=>({})),
	DB.get('permissions').then(json).catch(e=>({'':2})),
])
Object.setPrototypeOf(PERMISSIONS, null)
Object.setPrototypeOf(GAMERULES, null)
filesLoaded('Files loaded')

let resave = 0
export async function savePermissions(){
	if(resave) return void(resave = 2)
	resave = 1
	do await DB.put("permissions", JSON.stringify(PERMISSIONS)); while(resave == 2)
	resave = 0
}

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

export const DEFAULT_TPS = 20
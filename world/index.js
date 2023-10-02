import { DB, filesLoaded, json } from '../config.js'
export const Dimensions = {}
Object.setPrototypeOf(Dimensions, null)

export const players = new Map()

export const OP = 4, MOD = 3, NORMAL = 2, SPECTATE = 1
export const PERMISSIONS = await DB.get("permissions").then(json).catch(e=>({'':2}))
filesLoaded('Files loaded')
Object.setPrototypeOf(PERMISSIONS, null)
let resave = 0
export async function savePermissions(){
	if(resave) return void(resave = 2)
	resave = 1
	do await DB.put("permissions", JSON.stringify(PERMISSIONS)); while(resave == 2)
	resave = 0
}
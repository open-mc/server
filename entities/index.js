import fs from 'fs/promises'
import { jsonToType, typeToJson } from '../utils/data.js'
//import all entity files
import { Entities, Entity, EntityIDs } from './entity.js'
await Promise.all((await fs.readdir(PATH + 'entities/', {withFileTypes: true})).filter(a=>a.isDirectory()).map(({name}) => fs.readdir(PATH + 'entities/' + name).then(a => Promise.all(a.map(file => import(PATH + 'entities/' + name + '/' + file))))))
let modified = false
export let entityindex
for(const a of await fs.readFile(WORLD + 'defs/entityindex.txt').then(a=>(entityindex = ''+a).split('\n'))){
	let [name, ...history] = a.split(' ')
	let entity = Entities[name]
	if(!entity){EntityIDs.push(Entities.player);continue}
	let sd = typeToJson(entity.savedata)
	if((history[history.length-1] || 'null') == sd){history.pop()}else{modified = true}
	entity.savedatahistory = history.mutmap(jsonToType)
	entity.id = EntityIDs.length
	EntityIDs.push(null)
}
for(const i in Entities){
	const E = Entities[i]
	if(Object.hasOwn(E.prototype, 'prototype')){ console.warn('Reused class for ' + E.prototype.className + ' (by ' + i + ')'); continue }
	Object.defineProperty(E, 'name', {value: i})
	// Force extend
	if(!(E.prototype instanceof Entity)){
		console.warn('Class ' + i + ' does not extend Entity\n')
		Object.setPrototypeOf(E, Entity)
		Object.setPrototypeOf(E.prototype, Entity.prototype)
	}
	if(E.id < 0) E.id = EntityIDs.length, E.savedatahistory = [], EntityIDs.push(null), modified = true
	EntityIDs[E.id] = Entities[i] = (a, b) => new E(a, b)
	// Copy static props to prototype
	// This will also copy .prototype, which we want
	const desc = Object.getOwnPropertyDescriptors(E)
	delete desc.length; delete desc.name; desc.className = {value: i, enumerable: false, writable: false}; desc.constructor = {value: Entities[i], enumerable: false, writable: false}
	Object.defineProperties(E.prototype, desc)
}
if(modified){
	await fs.writeFile(WORLD + 'defs/entityindex.txt', entityindex = EntityIDs.map(E=>E.className + E.savedatahistory.map(a=>' '+typeToJson(a)).join('') + (E.savedata ? ' ' + typeToJson(E.savedata) : '')).join('\n'))
}
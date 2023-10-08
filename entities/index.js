import fs from 'fs/promises'
import { jsonToType, typeToJson } from '../modules/dataproto.js'
import { Entities, Entity, EntityIDs } from './entity.js'

const loaded = task('Loading entities...')

// Monstrosity for importing all ./*/*.js
await Promise.all((await fs.readdir(PATH + 'entities/', {withFileTypes: true})).filter(a=>a.isDirectory()).map(({name}) => fs.readdir(PATH + 'entities/' + name).then(a => Promise.all(a.map(file => import(PATH + 'entities/' + name + '/' + file))))))
let modified = false
export let entityindex
for(const a of await DB.get('entityindex').catch(e=>'player {}').then(a=>(entityindex = ''+a).split('\n'))){
	let [name, ...history] = a.split(' ')
	const E = Entities[name]
	if(!E){EntityIDs.push(Entities.player);continue}
	let sd = typeToJson(E.savedata)
	if((history[history.length-1] || 'null') == sd){history.pop()}else{modified = true}
	E.savedatahistory = history.mutmap(jsonToType)
	if(Object.hasOwn(E, 'id'))
		if(E.className != name) Entities[name] = class extends E{static id = EntityIDs.length; static className = name}
		else Object.hasOwn(E, 'otherIds') ? E.otherIds.push(EntityIDs.length) : E.otherIds = [EntityIDs.length]
	else E.id = EntityIDs.length, E.className = name
	EntityIDs.push(null)
}
for(const name in Entities){
	const E = Entities[name]
	// Force extend
	if(!(E.prototype instanceof Entity)){
		console.warn('Class ' + name + ' does not extend Entity\n')
		Object.setPrototypeOf(E, Entity)
		Object.setPrototypeOf(E.prototype, Entity.prototype)
	}
	if(!Object.hasOwn(E, 'id'))
		E.id = EntityIDs.length, E.savedatahistory = [], EntityIDs.push(null), E.className = name, modified = true
	E.constructor = EntityIDs[E.id] = Entities[name] = (...e) => new E(...e)
	E.constructor.prototype = E.prototype
	if(E.otherIds) for(const i of E.otherIds) EntityIDs[i] = EntityIDs[E.id]
	// Copy static props to prototype
	// This will also copy .prototype, which we want
	let proto = E
	while(proto.prototype && !Object.hasOwn(proto.prototype, 'prototype')){
		const desc = Object.getOwnPropertyDescriptors(proto)
		delete desc.length; delete desc.name
		Object.defineProperties(proto.prototype, desc)
		proto = Object.getPrototypeOf(proto)
	}
}
if(modified){
	await DB.put('entityindex', entityindex = EntityIDs.map(E=>E.prototype.className + E.prototype.savedatahistory.map(a=>' '+typeToJson(a)).join('') + (E.prototype.savedata ? ' ' + typeToJson(E.prototype.savedata) : '')).join('\n'))
}

loaded(`${EntityIDs.length} Entities loaded`)
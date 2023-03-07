import fs from 'fs/promises'
import { jsonToType, typeToJson } from '../utils/data.js'
//import all item files
import { Item, ItemIDs, Items } from './item.js'
await Promise.all((await fs.readdir(PATH + 'items/', {withFileTypes: true})).filter(a=>a.isDirectory()).map(({name}) => fs.readdir(PATH + 'items/' + name).then(a => Promise.all(a.map(file => import(PATH + 'items/' + name + '/' + file))))))
let modified = false
export let itemindex
for(const a of await fs.readFile(WORLD + 'defs/itemindex.txt').then(a=>(itemindex = a+'').split('\n'))){
	let [name, ...history] = a.split(' ')
	const I = Items[name]
	if(!I){ItemIDs.push(Items.stone);continue}
	let sd = typeToJson(I.savedata)
	if(history[history.length-1] == sd){history.pop()}else if(sd != 'null'){modified = true}
	I.savedatahistory = history.mutmap(jsonToType)
	if('id' in I) I.otherIds ? I.otherIds.push(ItemIDs.length) : I.otherIds = [ItemIDs.length]
	else I.id = ItemIDs.length
	ItemIDs.push(null)
}
for(const i in Items){
	const I = Items[i]
	// Force extend
	if(!(I.prototype instanceof Item)){
		console.warn('Class ' + i + ' does not extend Item\n')
		Object.setPrototypeOf(I, Item)
		Object.setPrototypeOf(I.prototype, Item.prototype)
	}
	if(!Object.hasOwn(I, 'id')) I.id = ItemIDs.length, I.savedatahistory = [], ItemIDs.push(null), modified = true
	ItemIDs[I.id] = Items[i] = c => new I(c)
	if(I.otherIds) for(const i of I.otherIds) ItemIDs[i] = ItemIDs[I.id]
	I.className = i
	I.constructor = Items[i]
	// Copy static props to prototype
	// This will also copy .prototype, which we want
	let proto = I
	while(proto.prototype && !Object.hasOwn(proto.prototype, 'prototype')){
		const desc = Object.getOwnPropertyDescriptors(proto)
		delete desc.length; delete desc.name
		Object.defineProperties(proto.prototype, desc)
		proto = Object.getPrototypeOf(proto)
	}
	if(proto == I){ console.warn('Reused class for ' + I.prototype.className + ' (by ' + i + ')'); continue }
	Object.defineProperty(I, 'name', {value: i})
	Object.setPrototypeOf(Items[i], I.prototype)
	Object.defineProperties(Items[i], Object.getOwnPropertyDescriptors(new I(1)))
}
if(modified){
	await fs.writeFile(WORLD + 'defs/itemindex.txt', itemindex = ItemIDs.map(I=>I.className + I.savedatahistory.map(a=>' '+typeToJson(a)).join('') + (I.savedata ? ' '+typeToJson(I.savedata) : '')).join('\n'))
}
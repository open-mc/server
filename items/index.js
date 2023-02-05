import fs from 'fs/promises'
import { jsonToType, typeToJson } from '../utils/data.js'
//import all item files
import { Item, ItemIDs, Items } from './item.js'
await Promise.all((await fs.readdir(PATH + 'items/', {withFileTypes: true})).filter(a=>a.isDirectory()).map(({name}) => fs.readdir(PATH + 'items/' + name).then(a => Promise.all(a.map(file => import(PATH + 'items/' + name + '/' + file))))))
let modified = false
export let itemindex
for(const a of await fs.readFile(WORLD + 'defs/itemindex.txt').then(a=>(itemindex = a+'').split('\n'))){
	let [name, ...history] = a.split(' ')
	let item = Items[name]
	if(!item){ItemIDs.push(Items.stone);continue}
	let sd = typeToJson(item.savedata)
	if(history[history.length-1] == sd){history.pop()}else if(sd != 'null'){modified = true}
	for(const h of history)item.savedatahistory.push(jsonToType(h))
	item.id = ItemIDs.length
	ItemIDs.push(null)
}
for(const i in Items){
	const I = Items[i]
	if(Object.hasOwn(I.prototype, 'prototype')){ console.warn('Reused class for ' + I.prototype.className + ' (by ' + i + ')') }
	Object.defineProperty(I, 'name', {value: i})
	// Force extend
	if(!(I.prototype instanceof Item)){
		console.warn('Class ' + i + ' does not extend Item\n')
		Object.setPrototypeOf(I, Item)
		Object.setPrototypeOf(I.prototype, Item.prototype)
	}
	ItemIDs[I.id] = Items[i] = c => new I(c)
	// Copy static props to prototype
	// This will also copy .prototype, which we want
	const desc = Object.getOwnPropertyDescriptors(I)
	delete desc.length; delete desc.name; desc.className = {value: i, enumerable: false, writable: false}; desc.constructor = {value: Items[i], enumerable: false, writable: false}
	Object.defineProperties(I.prototype, desc)
	if(I.id < 0) I.id = ItemIDs.length, ItemIDs.push(null), modified = true
	Object.setPrototypeOf(Items[i], I.prototype)
	Object.defineProperties(Items[i], Object.getOwnPropertyDescriptors(new I(1)))
}
if(modified){
	await fs.writeFile(WORLD + 'defs/itemindex.txt', itemindex = ItemIDs.map(I=>I.className + I.savedatahistory.map(a=>' '+typeToJson(a)).join('') + (I.savedata ? ' '+typeToJson(I.savedata) : '')).join('\n'))
}
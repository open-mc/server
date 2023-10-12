//import all block files
import fs from 'fs/promises'
import { jsonToType, typeToJson } from '../modules/dataproto.js'
import { Chunk } from '../world/chunk.js'
import { BlockIDs, Blocks, Block } from './block.js'

const loaded = task('Loading blocks...')

// Monstrosity for importing all ./*/*.js
await Promise.all((await fs.readdir(PATH + 'blocks/', {withFileTypes: true})).filter(a=>a.isDirectory()).map(({name}) => fs.readdir(PATH + 'blocks/' + name).then(a => Promise.all(a.map(file => import('./' + name + '/' + file))))))

let modified = false
export let blockindex
for(const a of await DB.get('blockindex').catch(e=>'air').then(a=>(blockindex = a+'').split('\n'))){
	let [name, ...history] = a.split(' ')
	const B = Blocks[name]
	if(!B){BlockIDs.push(Blocks.air);continue}
	let sd = typeToJson(B.savedata)
	if(history[history.length-1] == sd){history.pop()}else if(sd != 'null'){modified = true}
	B.savedatahistory = history.mutmap(jsonToType)
	if(Object.hasOwn(B, 'id'))
		if(B.className != name) Blocks[name] = class extends B{static id = BlockIDs.length; static className = name}
		else Object.hasOwn(B, 'otherIds') ? B.otherIds.push(BlockIDs.length) : B.otherIds = [BlockIDs.length]
	else B.id = BlockIDs.length, B.className = name
	BlockIDs.push(B)
}

for(const name in Blocks){
	const B = Blocks[name]
	// Force extend
	if(!(B.prototype instanceof Block)){
		console.warn('Class ' + name + ' does not extend Block\n')
		Object.setPrototypeOf(B, Block)
		Object.setPrototypeOf(B.prototype, Block.prototype)
	}
	if(!Object.hasOwn(B, 'id'))
		B.id = BlockIDs.length, B.savedatahistory = [], BlockIDs.push(B), B.className = name, modified = true
	if(B.otherIds) for(const i of B.otherIds) BlockIDs[i] = BlockIDs[B.id]
	// Copy static props to prototype
	// This will also copy .prototype, which we want
	let proto = B
	while(proto.prototype && !Object.hasOwn(proto.prototype, 'prototype')){
		const desc = Object.getOwnPropertyDescriptors(proto)
		delete desc.length; delete desc.name
		Object.defineProperties(proto.prototype, desc)
		proto = Object.getPrototypeOf(proto)
	}
	if(!B.savedata){
		Object.defineProperties(B, Object.getOwnPropertyDescriptors(new B))
	}
}
for(const b in Blocks) Object.setPrototypeOf(Blocks[b], Blocks[b].prototype)
if(modified){
	await DB.put('blockindex', blockindex = BlockIDs.map(B => B.prototype.className + B.prototype.savedatahistory.map(a=>' '+typeToJson(a)).join('') + (B.prototype.savedata ? ' ' + typeToJson(B.prototype.savedata) : '')).join('\n'))
}
if(BlockIDs.length > 65535) throw 'Limit of 65535 Block IDs exceeded'
Chunk.PM = new Uint16Array(BlockIDs.length).fill(0x0100)

loaded(`${BlockIDs.length} Blocks loaded`)
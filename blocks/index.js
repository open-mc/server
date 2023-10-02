//import all block files
import { fs } from '../internals.js'
import { jsonToType, typeToJson } from 'dataproto'
import { Chunk } from '../world/chunk.js'
import { BlockIDs, Blocks, Block } from './block.js'
import { DB } from '../config.js'

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
	BlockIDs.push(null)
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
		B.id = BlockIDs.length, B.savedatahistory = [], BlockIDs.push(null), B.className = name, modified = true
	B.constructor = BlockIDs[B.id] = Blocks[name] = B.savedata ? (...a) => new B(...a) : function a(){return a}
	B.constructor.prototype = B.prototype
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
	Object.setPrototypeOf(Blocks[name], B.prototype)
	Object.defineProperties(Blocks[name], Object.getOwnPropertyDescriptors(new B()))
}
if(modified){
	await DB.put('blockindex', blockindex = BlockIDs.map(B => B.prototype.className + B.prototype.savedatahistory.map(a=>' '+typeToJson(a)).join('') + (B.prototype.savedata ? ' ' + typeToJson(B.prototype.savedata) : '')).join('\n'))
}

Chunk.preAllocatedTiles.fill(Blocks.air)
Chunk.PM = new Uint16Array(BlockIDs.length).fill(65535)

loaded(`${BlockIDs.length} Blocks loaded`)
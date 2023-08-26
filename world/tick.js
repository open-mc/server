import { players } from '../world/index.js'
import { DataWriter } from 'dataproto'
import { Chunk } from './chunk.js'
import { allDimensions, Dimensions } from './index.js'
import { fastCollision, stepEntity } from './physics.js'
import { stat, statAvg, STATS } from '../config.js'
import { mirrorEntity } from './encodemove.js'

export let currentTPS = 0
export const entityMap = new Map()
export let actualTPS = currentTPS
export function tick(){
	for(const w of allDimensions){
		w.tick++
		for(const ch of Dimensions[w].values()){
			if(!(ch instanceof Chunk))continue
			w.check(ch)
		}
	}
	for(const e of entityMap.values()){
		if(!e.sock & !(!e.chunk | !e.world))
			fastCollision(e), stepEntity(e)
		mirrorEntity(e)
	}
	for(const pl of players.values()){
		const {packets, ebuf, tbuf} = pl.sock
		if(tbuf.length || tbuf.i > 1){
			pl.sock.send(tbuf.build())
			void (pl.sock.tbuf = new DataWriter()).byte(8)
		}
		if(ebuf.length || ebuf.i > 1){
			pl.sock.send(ebuf.build())
			void (pl.sock.ebuf = new DataWriter()).byte(20)
		}
		for(let i = 0; i < packets.length; i++)
			pl.sock.send(packets[i])
		packets.length = 0
	}
}
function everySecond(){
	for(const pl of players.values()){
		const buf = new DataWriter()
		buf.byte(3)
		buf.double(pl.world ? pl.world.tick : 0)
		pl.sock.send(buf.build())
	}
	stat('misc', 'age')
}
let lastTick = 0
let timer = null
export function setTPS(a){
	currentTPS = actualTPS = a
	lastTick = performance.now()
	clearInterval(timer)
	timer = setInterval(everySecond, 1000)
}

globalThis.exiting = false
setTimeout(function s(){
	setImmediate(s)
	const mspt = 1000 / currentTPS
	const now = performance.now()
	if(exiting || lastTick + mspt >= now) return
	const dt = Math.floor((now - lastTick) / mspt)
	lastTick += dt*mspt
	actualTPS += (currentTPS/dt - actualTPS)/currentTPS/2
	statAvg('misc', 'tps', currentTPS/dt)
	tick()
})
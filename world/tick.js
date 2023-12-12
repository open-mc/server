import { players, stat, statAvg } from '../world/index.js'
import { DataWriter } from '../modules/dataproto.js'
import { Chunk } from './chunk.js'
import { Dimensions } from './index.js'
import { fastCollision, stepEntity } from './physics.js'
import { mirrorEntity } from './encodemove.js'

export let currentTPS = 0
export const entityMap = new Map()
export let actualTPS = currentTPS
export function tick(){
	for(const n in Dimensions){
		const w = Dimensions[n]
		w.tick++
		for(const ch of Dimensions[w].values()){
			if(!(ch instanceof Chunk))continue
			w.check(ch)
		}
		Dimensions[n].update?.()
	}
	for(const e of entityMap.values()){
		if(!e.sock && e.shouldSimulate())
			fastCollision(e)
		if(!e.sock && e.shouldSimulate())
			stepEntity(e)
		mirrorEntity(e)
	}
	for(const pl of players.values()){
		const {packets, ebuf, tbuf, ibuf} = pl.sock
		if(tbuf.length || tbuf.i > 1){
			pl.sock.send(tbuf.build())
			void (pl.sock.tbuf = new DataWriter()).byte(8)
		}
		if(ebuf.length || ebuf.i > 1){
			pl.sock.send(ebuf.build())
			void (pl.sock.ebuf = new DataWriter()).byte(20)
		}
		if(ibuf){
			pl.sock.send(ibuf.build())
			pl.sock.ibuf = null
			pl.sock.ibufLastB = NaN
		}
		pl.checkInterface()
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
let timer = null
export function setTPS(a){
	currentTPS = actualTPS = a
	lastTick = performance.now()
	clearInterval(timer)
	timer = setInterval(everySecond, 1000)
}
globalThis.exiting = false
let lastTick = performance.now()
setInterval(function s(){
	const mspt = 1000 / currentTPS
	const now = performance.now()
	if(exiting || lastTick + mspt >= now) return
	const dt = Math.floor((now - lastTick) / mspt)
	lastTick += dt*mspt
	actualTPS += (currentTPS/dt - actualTPS)/currentTPS/2
	statAvg('misc', 'tps', currentTPS/dt)
	tick()
})
import { players, stat, statAvg, STATS } from '../world/index.js'
import { DataWriter } from '../modules/dataproto.js'
import { updateStats } from './chunk.js'
import { Dimensions } from './index.js'
import { fastCollision, stepEntity } from './physics.js'
import { encodeDelete, mirrorEntity, mirrorEntitySelf } from './encodemove.js'

export let currentTPS = 0
export const entityMap = new Map()
export const toUnlink = new Map()
export let actualTPS = currentTPS
export let tickBits = 0

export let tickFlags = 3
export let setTickFlags = (e, d=0) => tickFlags = e&3|d<<2
let curTick = STATS.misc.tps_count ?? 0

export function tick(){
	let t = tickFlags
	if(t>3) tickFlags-=4, t=3
	tickBits = 1
	for(let i = 1; i < 32; i++) if(!(curTick%i)) tickBits |= 1<<i
	if(t&1) for(const n in Dimensions){
		const w = Dimensions[n]
		w.tick++
		for(const ch of w.values())
			if(w.check(ch)) ch.tick()
		w.update?.()
	}else for(const n in Dimensions){
		const w = Dimensions[n]
		for(const ch of w.values()) w.check(ch)
	}
	if(t&2) for(const e of entityMap.values()){
		const {world, chunk, sock} = e
		if(world && chunk && !sock){
			if(floor(e.x)>>>5&1)
				if(floor(e.y)>>>5&1){ if((chunk.loadedAround&7)!=7) continue }
				else if((chunk.loadedAround&28)!=28) continue
			else
				if(floor(e.y)>>>5&1){ if((chunk.loadedAround&112)!=112) continue }
				else if((chunk.loadedAround&193)!=193) continue
			fastCollision(e)
			stepEntity(e)
		}
		if(e.netId >= 0) mirrorEntity(e)
	}
	for(const p of players.values()) if(p.netId<0) mirrorEntitySelf(p); else mirrorEntity(p)
	for(const {0:e,1:id} of toUnlink) encodeDelete(e, id)
	toUnlink.clear()
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
		for(let i = 0; i < packets.length; i++){
			pl.sock.send(packets[i])
		}
		packets.length = 0
	}
	updateStats()
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
let lastTick = performance.now()
setInterval(function s(){
	const mspt = 1000 / currentTPS
	const now = performance.now()
	if(exiting || lastTick + mspt >= now) return
	const dt = Math.floor((now - lastTick) * currentTPS * .001)
	lastTick += dt*mspt
	const a = currentTPS / dt
	actualTPS += (a - actualTPS)*mspt*.0005
	statAvg('misc', 'tps', a)
	curTick++
	tick()
})
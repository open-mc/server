import { entityMap } from '../entities/entity.js'
import { players } from '../world/index.js'
import { DataWriter } from '../utils/data.js'
import { Chunk } from './chunk.js'
import { allDimensions, Dimensions } from './index.js'
import { stepEntity } from './physics.js'
import { DEFAULT_TPS, stat, statAvg } from '../config.js'
import { mirrorEntity } from './encodemove.js'

export function tick(){
	if(exiting) return
	for(const w of allDimensions){
		w.tick++
		for(const ch of Dimensions[w].values()){
			if(!(ch instanceof Chunk))continue
			w.check(ch)
		}
	}
	for(const e of entityMap.values()){
		if(!!e.id & !(!e.chunk | !e.world))
			stepEntity(e)
		mirrorEntity(e)
	}
	for(const pl of players.values()){
		const {packets, ebuf, tbuf} = pl.sock
		if(tbuf.length || tbuf.i > 1){
			tbuf.pipe(pl.sock)
			void (pl.sock.tbuf = new DataWriter()).byte(8)
		}
		if(ebuf.length || ebuf.i > 1){
			ebuf.pipe(pl.sock)
			void (pl.sock.ebuf = new DataWriter()).byte(20)
		}
		for(let i = 0; i < packets.length; i++)
			pl.sock.send(packets[i])
		packets.length = 0
	}
	statAvg('misc', 'tps', -1000 / (lastTick - (lastTick = performance.now())))
}

function everySecond(){
	for(const pl of players.values()){
		const buf = new DataWriter()
		buf.byte(3)
		buf.double(pl.world ? pl.world.tick : 0)
		buf.pipe(pl.sock)
	}
	stat('misc', 'age')
}
let lastTick = 0
let tickTimer = null, timer2 = null
export let current_tps = DEFAULT_TPS
export function setTPS(a){
	current_tps = a
	lastTick = performance.now()
	clearInterval(tickTimer)
	tickTimer = setInterval(tick, 1000 / a)
	clearInterval(timer2)
	timer2 = setInterval(everySecond, 1000)
}
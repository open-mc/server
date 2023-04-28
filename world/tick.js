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
		mirrorEntity(e)
		if(!e.chunk | !e.world)continue
		if(e.id) stepEntity(e)
		const x0 = e.x - e.width - e.collisionTestPadding, x1 = e.x + e.width + e.collisionTestPadding
		const y0 = e.y - e.collisionTestPadding, y1 = e.y + e.height + e.collisionTestPadding
		const cx0 = floor(x0 - 16) >>> 6, cx1 = ceil((x1 + 16) / 64) & 67108863
		const cy0 = floor(y0) >>> 6, cy1 = ceil((y1 + 32) / 64) & 67108863
		for(let cx = cx0; cx != cx1; cx = cx + 1 & 67108863){
			for(let cy = cy0; cy != cy1; cy = cy + 1 & 67108863){
				const chunk = e.chunk && (e.chunk.x == cx & e.chunk.y == cy) ? e.chunk : e.world && e.world.get(cx+cy*67108864)
				if(!chunk || !chunk.tiles) continue
				for(const e2 of chunk.entities){
					const {collisionTestPadding: ctp} = e2
					if(e2.netId <= e.netId || e2.x + e2.width + ctp < x0 || e2.x - e2.width - ctp > x1 || e2.y + e2.height + ctp < y0 || e2.y - ctp > y1) continue
					e.touch?.(e2)
					e2.touch?.(e)
				}
			}
		}
		e.age++
		e.tick?.()
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
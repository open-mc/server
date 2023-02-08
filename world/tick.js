import { entityMap } from '../entities/entity.js'
import { players } from '../world/index.js'
import { DataWriter } from '../utils/data.js'
import { Chunk } from './chunk.js'
import { allDimensions, Dimensions } from './index.js'
import { stepEntity } from './physics.js'

export function encodeMove(e, pl){
	const buf = pl.sock.ebuf
	buf.byte(e.mv)
	buf.int(e._id | 0), buf.short(e._id / 4294967296 | 0)
	if(e.mv & 128)buf.short(e.id)
	if(e.mv & 1)buf.double(e.x)
	if(e.mv & 2)buf.double(e.y)
	if(e.mv & 4)buf.string(e.name)
	if(e.mv & 8)buf.short(e.state)
	if(e.mv & 16)buf.float(e.dx)
	if(e.mv & 32)buf.float(e.dy)
	if(e.mv & 64)buf.float(e.f)
	if(e.mv & 128)buf.write(e.savedata, e)
}
function moved(e){
	const {chunk, ochunk} = e
	if(chunk != ochunk){
		if(ochunk){
			for(const pl of ochunk.players){
				if((chunk && chunk.players.includes(pl)) || e == pl)continue
				pl.sock.ebuf.short(0)
				pl.sock.ebuf.uint32(e._id), pl.sock.ebuf.short(e._id / 4294967296 | 0)
			}
		}
		if(chunk){
			for(const pl of chunk.players){
				if(ochunk && e == pl)continue
				if(ochunk && ochunk.players.includes(pl)){encodeMove(e, pl);continue}
				const buf = pl.sock.ebuf
				buf.byte(255)
				buf.int(e._id | 0), buf.short(e._id / 4294967296 | 0)
				buf.short(e.id)
				buf.double(e.x)
				buf.double(e.y)
				buf.string(e.name)
				buf.short(e.state)
				buf.float(e.dx)
				buf.float(e.dy)
				buf.float(e.f)
				buf.write(e.savedata, e)
			}
		}
		e.ochunk = chunk
	}else for(const pl of chunk.players)if(e != pl)encodeMove(e, pl)
	e.mv = 0
}

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
		if(!e.chunk)continue
		if(e.mv) moved(e)
		e.tick?.()
		stepEntity(e)
		const x0 = e.x - e.width, x1 = e.x + e.width
		const y0 = e.y, y1 = e.y + e.height
		const cx0 = floor(e.x - e.width - 16) >>> 6, cx1 = ceil((e.x + e.width + 16) / 64) & 67108863
		const cy0 = floor(y0) >>> 6, cy1 = ceil((e.y + e.height + 32) / 64) & 67108863
		for(let cx = cx0; cx != cx1; cx = cx + 1 & 67108863){
			for(let cy = cy0; cy < cy1; cy = cy + 1 & 67108863){
				const chunk = e.chunk.x == cx && e.chunk.y == cy ? e.chunk : e.world.get(cx+cy*67108864)
				if(!chunk) continue
				for(const e2 of chunk.entities){
					if(e2._id <= e._id || e2.x + e2.width < x0 || e2.x - e2.width > x1 || e2.y + e2.height < y0 || e2.y > y1) continue
					e.touch?.(e2)
					e2.touch?.(e)
				}
			}
		}
		e.age++
	}
	for(const pl of players.values()){
		if(pl.sock.ebuf.length || pl.sock.ebuf.i > 1){
			pl.sock.ebuf.pipe(pl.sock)
			pl.sock.ebuf = new DataWriter()
			pl.sock.ebuf.byte(20)
		}
		if(pl.sock.tbuf.length || pl.sock.tbuf.i > 1){
			pl.sock.tbuf.pipe(pl.sock)
			pl.sock.tbuf = new DataWriter()
			pl.sock.tbuf.byte(8)
		}
		const {packets} = pl.sock
		for(let i = 0; i < packets.length; i++)
			packets[i].pipe(pl.sock)
	}
}

function everySecond(){
	for(const pl of players.values()){
		const buf = new DataWriter()
		buf.byte(3)
		buf.double(pl.world ? pl.world.tick : 0)
		buf.pipe(pl.sock)
	}
}

let tickTimer = null, timer2 = null
export function setTPS(a){
	clearInterval(tickTimer)
	tickTimer = setInterval(tick, 1000 / a - 1)
	clearInterval(timer2)
	timer2 = setInterval(everySecond, 1000)
}
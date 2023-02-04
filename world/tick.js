import { entityMap } from '../entities/entity.js'
import { players } from '../world/index.js'
import { DataWriter } from '../utils/data.js'
import { Chunk } from './chunk.js'
import { allDimensions, Dimensions } from './index.js'

export function encodeMove(e, pl){
	const buf = pl.ebuf
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
	if(e.mv & 128)buf.write(e._.savedata, e)
}
function moved(e){
	const {chunk, ochunk} = e
	if(chunk != ochunk){
		if(ochunk){
			for(const pl of ochunk.players){
				if((chunk && chunk.players.includes(pl)) || e == pl)continue
				pl.ebuf.byte(0)
				pl.ebuf.int(e._id | 0), pl.ebuf.short(e._id / 4294967296 | 0)
			}
		}
		if(chunk){
			for(const pl of chunk.players){
				if(ochunk && e == pl)continue
				if(ochunk && ochunk.players.includes(pl)){encodeMove(e, pl);continue}
				const buf = pl.ebuf
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
				buf.write(e._.savedata, e)
			}
		}
		e.ochunk = chunk
	}else for(const pl of chunk.players)if(e != pl)encodeMove(e, pl)
	e.mv = 0
}

export function tick(){
	for(const w of allDimensions){
		w.tick++
		for(const ch of Dimensions[w].values()){
			if(!(ch instanceof Chunk))continue
			w.check(ch)
		}
	}
	for(const e of entityMap.values()){
		if(!e.chunk)continue
		if(e.mv)moved(e)
	}
	for(const pl of players.values()){
		if(pl.ebuf.length || pl.ebuf.i > 1){
			pl.ebuf.pipe(pl.sock)
			pl.ebuf = new DataWriter()
			pl.ebuf.byte(20)
			const length = pl.sock.packets.length
			for(let i = 0; i < length; i++){
				pl.sock.packets[i].pipe(pl.sock)
			}
		}
		
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
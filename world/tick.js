import { entityMap } from '../entities/entity.js'
import { players } from '../world/index.js'
import { DataWriter } from '../utils/data.js'
import { Chunk } from './chunk.js'
import { allDimensions, Dimensions } from './index.js'

export function encodeMove(e, pl){
	const buf = pl.ebuf
	buf.byte(e.mv)
	buf.int(e._id | 0), buf.short(e._id / 4294967296 | 0)
	if(e.mv & 1)buf.double(e.x)
	if(e.mv & 2)buf.double(e.y)
	if(e.mv & 4)buf.float(e.dx)
	if(e.mv & 8)buf.float(e.dy)
	if(e.mv & 16)buf.float(e.f)
}
function moved(e){
	const {chunk, ochunk} = e
	if(chunk != ochunk){
		if(ochunk){
			for(const pl of ochunk.players){
				if(chunk.players.includes(pl))continue
				pl.ebuf.byte(0)
				pl.ebuf.int(e._id | 0), pl.ebuf.short(e._id / 4294967296 | 0)
			}
		}
		for(const pl of chunk.players){
			if(ochunk && ochunk.players.includes(pl)){if(e != pl)encodeMove(e, pl);continue}
			const buf = pl.ebuf
			buf.byte(255)
			buf.int(e._id | 0), buf.short(e._id / 4294967296 | 0)
			buf.short(e.id)
			buf.double(e.x)
			buf.double(e.y)
			buf.float(e.dx)
			buf.float(e.dy)
			buf.float(e.f)
			buf.write(e._.savedata, e)
		}
		e.ochunk = chunk
	}else for(const pl of chunk.players)if(e != pl)encodeMove(e, pl)
	e.mv = 0
}

export function tick(){
	for(const d of allDimensions)
		for(const v of Dimensions[d].values()){
			if(!(v instanceof Chunk))continue
			d.check(v)
		}
	for(const e of entityMap.values()){
		if(!e.chunk)continue
		if(e.mv)moved(e)
	}
	for(const pl of players.values()){
		if(!pl.ebuf.length && pl.ebuf.i <= 1)continue
		pl.ebuf.pipe(pl.sock)
		pl.ebuf = new DataWriter()
		pl.ebuf.byte(20)
	}
}

let tickTimer = null
export function setTPS(a){
	clearInterval(tickTimer)
	tickTimer = setInterval(tick, 1000 / a - 1)
}
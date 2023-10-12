import { BlockIDs } from '../blocks/block.js'
import { GAMERULES } from './index.js'
import { EntityIDs } from '../entities/entity.js'
import { _newChunk, antWorld, gotochunk, peekpos } from '../misc/ant.js'

const IDs = new Uint8Array(4096)

export class Chunk extends Uint16Array{
	static PM
	constructor(x, y, world){
		super(4096)
		this.tileData = new Map
		this.sockets = []
		this.world = world
		this.x = x & 0x3ffffff; this.y = y & 0x3ffffff
		this.entities = []; this.t = -1
		this.biomes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
		this.loadedAround = 0b00000000
	}
	parse(buf){
		if(this.world == antWorld) _newChunk(this)
		//read buf palette
		const Schema = Chunk.savedatahistory[buf.flint()] || Chunk.savedata
		let ticks = buf.short()
		while(ticks--) this.blockupdates.add(buf.short())
		let palettelen = buf.byte() + 1 & 0xFF
		let id
		while((id = buf.short()) != 65535){
			const e = new EntityIDs[id]()
			e.place(this.world, buf.short() / 1024 + (this.x << 6), buf.short() / 1024 + (this.y << 6))
			e.chunk = this
			this.entities.push(e)
			buf.setUint32(buf.i, e.netId)
			buf.setUint16((buf.i += 6) - 2, e.netId / 4294967296)
			e.name = e._name = buf.string()
			e.state = e._state = buf.short()
			e.dx = e._dx = buf.float()
			e.dy = e._dy = buf.float()
			e.f = e._f = buf.float()
			e.age = buf.double()
			if(e.savedata)buf.read(e.savedatahistory[buf.flint()] || e.savedata, e)
		}
		this.biomes[0] = buf.byte(); this.biomes[1] = buf.byte()
		this.biomes[2] = buf.byte(); this.biomes[3] = buf.byte()
		this.biomes[4] = buf.byte(); this.biomes[5] = buf.byte()
		this.biomes[6] = buf.byte(); this.biomes[7] = buf.byte()
		this.biomes[8] = buf.byte(); this.biomes[9] = buf.byte()
		let palette = []
		if(palettelen) for(let i=0;i<palettelen;i++) palette.push(buf.short())
		let j = 0
		if(palettelen == 0){
			const arr = buf.uint8array(8192)
			this.set(new Uint16Array(arr.buffer, arr.byteOffset, arr.byteLength))
		}else if(palettelen == 1) for(;j<4096;j++)this[j] = palette[0]
		else if(palettelen == 2){
			for(;j<4096;j+=8){
				const byte = buf.byte()
				this[j  ] = palette[byte&1]
				this[j+1] = palette[(byte>>1)&1]
				this[j+2] = palette[(byte>>2)&1]
				this[j+3] = palette[(byte>>3)&1]
				this[j+4] = palette[(byte>>4)&1]
				this[j+5] = palette[(byte>>5)&1]
				this[j+6] = palette[(byte>>6)&1]
				this[j+7] = palette[byte>>7]
			}
		}else if(palettelen <= 4){
			for(;j<4096;j+=4){
				const byte = buf.byte()
				this[j  ] = palette[byte&3]
				this[j+1] = palette[(byte>>2)&3]
				this[j+2] = palette[(byte>>4)&3]
				this[j+3] = palette[byte>>6]
			}
		}else if(palettelen <= 16){
			for(;j<4096;j+=2){
				const byte = buf.byte()
				this[j  ] = palette[byte&15]
				this[j+1] = palette[(byte>>4)]
			}
		}else for(;j<4096;j++) this[j] = palette[buf.byte()]
		//parse block entities
		for(j=0;j<4096;j++){
			if(this[j] == 65535) this[j] = buf.short()
			const block = BlockIDs[this[j]]
			if(!block.savedata)continue
			this[j] = 65535
			this.tileData.set(j, buf.read(block.savedatahistory[buf.flint()] || block.savedata, new block))
		}
		buf.read(Schema, this)
	}
	toBuf(buf, packet = false){
		let palette = [], paletteFull = []
		const PM = Chunk.PM
		for(let i = 0; i < 4096; i++){
			let id = this[i]
			if(id == 65535) id = this.tileData.get(i).id
			const a = PM[IDs[i] = id]
			if(a < 0x0100) continue
			if(a > 0x0100){
				if(a < 0x010A){ PM[id] = a+1; continue }
				PM[id] = palette.push(id)-1
				if(palette.length+(palette.length!=paletteFull.length) == 256){ palette.length = 0; break }
			}else if(palette.length != 255) PM[id] = 0x0101, paletteFull.push(id)
			else{ palette.length = 0; break }
		}
		if(packet){
			buf.byte(16)
			buf.int(this.x)
			buf.int(this.y)
		}
		buf.flint(Chunk.savedatahistory.length)
		if(packet) buf.short(0)
		else{
			buf.short(this.blockupdates.size)
			for(const t of this.blockupdates) buf.short(t)
		}
		buf.byte(palette.length ? palette.length - (palette.length == paletteFull.length) : 255)

		for(const e of this.entities){
			if(e.sock && !packet)continue
			buf.short(e.id)
			buf.short(max(0, min(floor((e.x-(this.x<<6))*1024), 65535)))
			buf.short(max(0, min(floor((e.y-(this.y<<6))*1024), 65535)))
			buf.int(e.netId | 0)
			buf.short(e.netId / 4294967296 | 0)
			buf.string(e.name)
			buf.short(e.state)
			buf.float(e.dx)
			buf.float(e.dy)
			buf.float(e.f)
			buf.double(e.age)
			if(e.savedata) buf.flint(e.savedatahistory.length), buf.write(e.savedata, e)
		}
		buf.short(65535)
		for(const b of this.biomes) buf.byte(b)

		//encode palette
		if(palette.length){
			let encode65535 = false
			for(const p of paletteFull)
				if(PM[p]>=0x0100) PM[p] = palette.length, encode65535 = true
			if(encode65535) palette.push(65535)
			for(const p of palette) buf.short(p)
		}

		//encode blocks
		if(palette.length == 0) buf.uint8array(new Uint8Array(this.buffer, this.byteOffset, this.byteLength), 8192)
		else if(palette.length == 1);
		else if(palette.length == 2){
			for(let i = 0; i < 4096; i+=8)
				buf.byte((PM[IDs[i]] << 0)
				| (PM[IDs[i+1]] << 1)
				| (PM[IDs[i+2]] << 2)
				| (PM[IDs[i+3]] << 3)
				| (PM[IDs[i+4]] << 4)
				| (PM[IDs[i+5]] << 5)
				| (PM[IDs[i+6]] << 6)
				| (PM[IDs[i+7]] << 7))
		}else if(palette.length <= 4){
			for(let i = 0; i < 4096; i+=4)
				buf.byte(PM[IDs[i]]
				| (PM[IDs[i+1]] << 2)
				| (PM[IDs[i+2]] << 4)
				| (PM[IDs[i+3]] << 6))
		}else if(palette.length <= 16){
			for(let i = 0; i < 4096; i+=2)
				buf.byte(PM[IDs[i]] | (PM[IDs[i+1]] << 4))
		}else for(let i = 0; i < 4096; i++) buf.byte(PM[IDs[i]])

		//save block entities
		for(let i = 0; i < 4096; i++){
			if(PM[IDs[i]] == palette.length-1) buf.short(IDs[i])
			if(this[i] != 65535)continue
			const tile = this.tileData.get(i)
			buf.flint(tile.savedatahistory.length)
			buf.write(tile.savedata, tile)
		}
		for(const p of paletteFull) PM[p] = 0x0100
		buf.write(Chunk.savedata, this)
		return buf
	}
	static savedatahistory = [{}]
	static diskBufToPacket(buf, x, y){
		const buf2 = new Uint8Array(buf.byteLength + 9)
		buf2[0] = 16
		buf2[1] = x << 6 >>> 30; buf2[2] = x >> 16; buf2[3] = x >> 8; buf2[4] = x
		buf2[5] = y << 6 >>> 30; buf2[6] = y >> 16; buf2[7] = y >> 8; buf2[8] = y
		buf2.set(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength), 9)
		return buf2
	}
	[Symbol.for('nodejs.util.inspect.custom')](){return 'Chunk { x: \x1b[33m'+(this.x<<6>>6)+'\x1b[m, y: \x1b[33m'+(this.y<<6>>6)+'\x1b[m }'}

	blockupdates = new Set
	blockupdates2 = new Set
	tick(){
		gotochunk(this)
		const s = this.blockupdates
		this.blockupdates = this.blockupdates2
		this.blockupdates2 = s
		let i = GAMERULES.randomtickspeed + 1
		let aliveQuarters = (this.loadedAround&193)==193|((this.loadedAround&7)==7)<<1|((this.loadedAround&28)==28)<<2|((this.loadedAround&112)==112)<<3
		while(--i){
			const pos = floor(random() * 4096)
			if(aliveQuarters>>(pos>>5&1|pos>>10&2)&1)
				peekpos(pos).randomtick?.()
		}
		aliveQuarters = (aliveQuarters&8)<<12|(aliveQuarters&4)<<10|(aliveQuarters&2)<<2|(aliveQuarters&1)
			| (this.loadedAround<<31>>31&0x6000) | (this.loadedAround<<29>>31&0x0880) | (this.loadedAround<<27>>31&0x0006) | (this.loadedAround<<25>>31&0x0110) | 0x0660
		for(const p of s)
			if(aliveQuarters>>(p>>4&3|p>>8&12)&1)
				peekpos(p).update?.()
			else this.blockupdates.add(p)
		if(s.size) s.clear()
	}

	static savedata = {portals: [Uint16]}
	
	portals = []
}

Function.optimizeImmediately(Chunk, Chunk.prototype.parse, Chunk.prototype.toBuf, Chunk.prototype.tick, Chunk.diskBufToPacket)
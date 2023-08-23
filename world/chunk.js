import { BlockIDs, Blocks } from '../blocks/block.js'
import { GAMERULES } from '../config.js'
import { EntityIDs } from '../entities/entity.js'
import { optimize } from '../internals.js'
import { gotochunk, peekpos } from '../misc/ant.js'

export class Chunk{
	static PM
	static preAllocatedTiles = new Array(4096)
	constructor(x, y, world){
		this.sockets = []
		this.world = world
		this.x = x & 0x3ffffff; this.y = y & 0x3ffffff
		this.tiles = Chunk.preAllocatedTiles.slice(0)
		this.entities = []; this.t = -1
		this.biomes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	}
	parse(buf){
		this.world.set(this.x+this.y*0x4000000, this)
		//read buf palette
		const Schema = Chunk.savedatahistory[buf.flint()] || Chunk.savedata
		let palettelen = buf.short() + 1
		let id
		while((id = buf.short()) != 65535){
			const e = EntityIDs[id]()
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
		if(palettelen < 1024) for(let i=0;i<palettelen;i++) palette.push(BlockIDs[buf.short()])
		let j = 0
		if(palettelen<2){
			const block = palette[0]
			for(;j<4096;j++)this.tiles[j] = block
		}else if(palettelen == 2){
			for(;j<4096;j+=8){
				const byte = buf.byte()
				this.tiles[j  ] = palette[byte&1]
				this.tiles[j+1] = palette[(byte>>1)&1]
				this.tiles[j+2] = palette[(byte>>2)&1]
				this.tiles[j+3] = palette[(byte>>3)&1]
				this.tiles[j+4] = palette[(byte>>4)&1]
				this.tiles[j+5] = palette[(byte>>5)&1]
				this.tiles[j+6] = palette[(byte>>6)&1]
				this.tiles[j+7] = palette[byte>>7]
			}
		}else if(palettelen <= 4){
			for(;j<4096;j+=4){
				const byte = buf.byte()
				this.tiles[j  ] = palette[byte&3]
				this.tiles[j+1] = palette[(byte>>2)&3]
				this.tiles[j+2] = palette[(byte>>4)&3]
				this.tiles[j+3] = palette[byte>>6]
			}
		}else if(palettelen <= 16){
			for(;j<4096;j+=2){
				const byte = buf.byte()
				this.tiles[j  ] = palette[byte&15]
				this.tiles[j+1] = palette[(byte>>4)]
			}
		}else if(palettelen <= 256){
			for(;j<4096;j++) this.tiles[j] = palette[buf.byte()]
		}else if(palettelen < 1024){
			for(;j<4096;j+=2){
				let byte2
				this.tiles[j] = palette[buf.byte() + (((byte2 = buf.byte())&0x0F)<<8)]
				this.tiles[j] = palette[buf.byte() + ((byte2&0xF0)<<4)]
			}
		}else for(;j<4096;j++)
			this.tiles[j] = BlockIDs[buf.short()]
		//parse block entities
		for(j=0;j<4096;j++){
			const block = this.tiles[j]
			if(!block){this.tiles[j] = Blocks.air; continue}
			if(!block.savedata)continue
			this.tiles[j] = buf.read(block.savedatahistory[buf.flint()] || block.savedata, block())
		}
		buf.read(Schema, this)
	}
	toBuf(buf, packet = false){
		let palette = []
		const PM = Chunk.PM
		for(let i = 0; i < 4096; i++){
			let id = this.tiles[i].id
			if(PM[id] === 65535){
				PM[id] = palette.length
				palette.push(id)
			}
			if(palette.length == 1024){
				for(let i of palette) PM[i] = 65535
				palette.length = 0
				break
			}
		}
		if(packet){
			buf.byte(16)
			buf.int(this.x)
			buf.int(this.y)
			buf.short(palette.length - 1)
		}else buf.flint(Chunk.savedatahistory.length), buf.short(palette.length - 1)

		for(const e of this.entities){
			if(e.sock && !packet)continue
			buf.short(e.id)
			buf.short((e.x % 64 + 64) * 1024)
			buf.short((e.y % 64 + 64) * 1024)
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
		for(const b of this.biomes)buf.byte(b)

		if(palette.length){
			//encode palette
			for(const p of palette) buf.short(p)

			//encode blocks
			if(palette.length == 1);
			else if(palette.length == 2){
				for(let i = 0; i < 4096; i+=8){
					buf.byte(((this.tiles[i].id == palette[1]) << 0)
					| ((this.tiles[i + 1].id == palette[1]) << 1)
					| ((this.tiles[i + 2].id == palette[1]) << 2)
					| ((this.tiles[i + 3].id == palette[1]) << 3)
					| ((this.tiles[i + 4].id == palette[1]) << 4)
					| ((this.tiles[i + 5].id == palette[1]) << 5)
					| ((this.tiles[i + 6].id == palette[1]) << 6)
					| ((this.tiles[i + 7].id == palette[1]) << 7))
				}
			}else if(palette.length <= 4){
				for(let i = 0; i < 4096; i+=4){
					buf.byte(PM[this.tiles[i].id]
					| (PM[this.tiles[i + 1].id] << 2)
					| (PM[this.tiles[i + 2].id] << 4)
					| (PM[this.tiles[i + 3].id] << 6))
				}
			}else if(palette.length <= 16){
				for(let i = 0; i < 4096; i+=2){
					buf.byte(PM[this.tiles[i].id]
					| (PM[this.tiles[i + 1].id] << 4))
				}
			}else if(palette.length <= 256){
				for(let i = 0; i < 4096; i++){
					buf.byte(PM[this.tiles[i].id])
				}
			}else{
				let j = 0
				for(let i = 0; i < 6144; i+=3, j+=2){
					buf.byte(PM[this.tiles[j].id])
					buf.byte(PM[this.tiles[j + 1].id])
					buf.byte((PM[this.tiles[j].id] >> 8) | ((PM[this.tiles[j + 1].id] >> 4) & 0xF0))
				}
			}
			// reset PM
			for(let i of palette) PM[i] = 65535
			palette.length = 0
		}else for(let i = 0; i < 4096; i++)
			buf.short(this.tiles[j].id)

		//save block entities
		for(let i = 0; i < 4096; i++){
			let tile = this.tiles[i]
			if(!tile.savedata)continue
			buf.flint(tile.savedatahistory.length)
			buf.write(tile.savedata, tile)
		}
		buf.write(Chunk.savedata, this)

		return buf
	}
	static savedatahistory = [{}]
	static diskBufToPacket(buf, x, y){
		const off = 1<<32-clz32(buf.getUint8(0)>>6)
		const buf2 = new Uint8Array(buf.byteLength - off + 9)
		buf2[0] = 16
		buf2[1] = x << 6 >>> 30; buf2[2] = x >> 16; buf2[3] = x >> 8; buf2[4] = x
		buf2[5] = y << 6 >>> 30; buf2[6] = y >> 16; buf2[7] = y >> 8; buf2[8] = y
		buf2.set(new Uint8Array(buf.buffer, buf.byteOffset + off, buf.byteLength - off), 9)
		return buf2
	}
	[Symbol.for('nodejs.util.inspect.custom')](){return 'Chunk { x: \x1b[33m'+(this.x<<6>>6)+'\x1b[m, y: \x1b[33m'+(this.y<<6>>6)+'\x1b[m }'}

	static savedata = {portals: [Uint16]}
	
	portals = []

	blockupdates = new Set
	blockupdates2 = new Set
	tick(){
		gotochunk(this)
		const s = this.blockupdates
		this.blockupdates = this.blockupdates2
		this.blockupdates2 = s
		let i = GAMERULES.randomtickspeed + 1
		while(--i) peekpos(floor(random() * 4096)).randomtick?.()
		for(const p of s){
			peekpos(p).update?.()
		}
		if(s.size) s.clear()
	}
}

optimize(Chunk, Chunk.prototype.toBuf)
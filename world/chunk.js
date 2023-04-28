import { BlockIDs, Blocks } from '../blocks/block.js'
import { EntityIDs } from '../entities/entity.js'
import { optimize } from '../internals.js'
import { DataReader } from '../utils/data.js'

// Turns out that this is BY MILES the fastest way to allocate a large array, and it allocates exactly how much we need, no more no less
const LIGHTNINGFASTALLOCATOR = new Function('return[' + 'null,'.repeat(4096) + ']')

export class Chunk{
	constructor(buf, world, pl = []){
		if(!buf.left || buf.byte() != 16)throw new TypeError("Invalid chunk data")
		const x = buf.int(), y = buf.int()
		world.set((this.x = x & 67108863)+(this.y = y & 67108863)*67108864, this)
		this.world = world
		this.tiles = LIGHTNINGFASTALLOCATOR()
		this.entities = []
		this.players = pl
		//read buf palette
		let palettelen = (x >>> 26) + (y >>> 26) * 64 + 1
		let id = buf.short()
		while(id){
			const e = EntityIDs[id]()
			e.place(world, buf.short() / 1024 + (this.x << 6), buf.short() / 1024 + (this.y << 6))
			e.chunk = this
			this.entities.push(e)
			buf.setUint32(buf.i, e.netId)
			buf.setUint16((buf.i += 6) - 2, e.netId / 4294967296)
			e.name = buf.string()
			e.state = buf.short()
			e.dx = buf.float()
			e.dy = buf.float()
			e.f = buf.float()
			e.age = buf.double()
			if(e.savedata)buf.read(e.savedatahistory[buf.flint()] || e.savedata, e)
			id = buf.short()
		}
		this.biomes = [buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte()]
		let palette = []
		for(let i = 0;i<palettelen;i++) palette.push(BlockIDs[buf.short()])
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
		}else{
			for(;j<4096;j+=2){
				let byte2
				this.tiles[j] = palette[buf.byte() + (((byte2 = buf.byte())&0x0F)<<8)]
				this.tiles[j] = palette[buf.byte() + ((byte2&0xF0)<<4)]
			}
		}
		//parse block entities
		for(j=0;j<4096;j++){
			const block = this.tiles[j]
			if(!block){this.tiles[j] = Blocks.air; continue}
			if(!block.savedata)continue
			this.tiles[j] = buf.read(block.savedatahistory[buf.flint()] || block.savedata, block())
		}
	}
	toBuf(buf){
		let palette = [], palette2 = Object.create(null)
		for(let i = 0; i < 4096; i++){
			let id = this.tiles[i].id
			if(!(id in palette2)){
				palette2[id] = palette.length
				palette.push(id)
			}
		}
		buf.byte(16)
		buf.int((this.x & 0x3ffffff) + (palette.length-1 << 26))
		buf.int((this.y & 0x3ffffff) + (palette.length-1 >> 6 << 26))
		for(const e of this.entities){
			if(!e.id)continue
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
		buf.short(0)
		
		for(const b of this.biomes)buf.byte(b)

		for(const p of palette) buf.short(p)
		//encode data
		if(palette.length < 2);
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
				buf.byte(palette2[this.tiles[i].id]
				| (palette2[this.tiles[i + 1].id] << 2)
				| (palette2[this.tiles[i + 2].id] << 4)
				| (palette2[this.tiles[i + 3].id] << 6))
			}
		}else if(palette.length <= 16){
			for(let i = 0; i < 4096; i+=2){
				buf.byte(palette2[this.tiles[i].id]
				| (palette2[this.tiles[i + 1].id] << 4))
			}
		}else if(palette.length <= 256){
			for(let i = 0; i < 4096; i++){
				buf.byte(palette2[this.tiles[i].id])
			}
		}else{
			let j = 0
			for(let i = 0; i < 6144; i+=3, j+=2){
				buf.byte(palette2[this.tiles[j].id])
				buf.byte(palette2[this.tiles[j + 1].id])
				buf.byte((palette2[this.tiles[j].id] >> 8) | ((palette2[this.tiles[j + 1].id] >> 4) & 0xF0))
			}
		}
		//save block entities
		for(let i = 0; i < 4096; i++){
			let tile = this.tiles[i]
			if(!tile.savedata)continue
			buf.flint(tile.savedatahistory.length)
			buf.write(tile.savedata, tile)
		}
		return buf
	}
	static bufOf(block, x, y){
		return new DataReader(Uint8Array.of(16, x << 6 >>> 30, x >>> 16, x >>> 8, x, y << 6 >>> 30, y >>> 16, y >>> 8, y, 0, 0, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, block.id >> 8, block.id))
	}
	[Symbol.for('nodejs.util.inspect.custom')](){return '<Chunk x: \x1b[33m'+(this.x<<6>>6)+'\x1b[m, y: \x1b[33m'+(this.y<<6>>6)+'\x1b[m>'}
}

optimize(Chunk, Chunk.prototype.toBuf)
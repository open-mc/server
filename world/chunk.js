import { BlockIDs } from '../blocks/block.js'
import { EntityIDs } from '../entities/entity.js'
import { DataReader } from '../utils/data.js'

export class Chunk{
	constructor(buf, world){
		if(!buf.left || buf.byte() != 16)throw new TypeError("Invalid chunk data")
		const x = buf.int(), y = buf.int()
		this.x = x << 6 >> 6
		this.y = y << 6 >> 6
		this.world = world
		this.tiles = []
		this.entities = new Set()
		this.players = null
		//read buf palette
		let palettelen = (x >>> 26) + (y >>> 26) * 64 + 1
		let id = buf.short()
		while(id){
			const e = EntityIDs[id](buf.short() / 1024 + (this.x << 6), buf.short() / 1024 + (this.y << 6), this.world)
			e.chunk = this
			buf.setUint32(buf.i, e._id)
			buf.setUint16((buf.i += 6) - 2, e._id / 4294967296)
			e.name = buf.string()
			e.state = buf.short()
			e.dx = buf.float()
			e.dy = buf.float()
			e.f = buf.float()
			if(e._.savedata)buf.read(e._.savedatahistory[buf.flint()] || e._.savedata, e)
			this.entities.add(e)
			id = buf.short()
		}
		this.biomes = [buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte(), buf.byte()]
		let palette = []
		for(let i = 0;i<palettelen;i++) palette.push(BlockIDs[buf.short()])
		let j = 0
		if(palettelen<2){
			const block = palette[0]()
			for(;j<4096;j++)this.tiles.push(block)
		}else if(palettelen == 2){
			for(;j<512;j++){
				const byte = buf.byte()
				this.tiles.push(palette[byte&1]())
				this.tiles.push(palette[(byte>>1)&1]())
				this.tiles.push(palette[(byte>>2)&1]())
				this.tiles.push(palette[(byte>>3)&1]())
				this.tiles.push(palette[(byte>>4)&1]())
				this.tiles.push(palette[(byte>>5)&1]())
				this.tiles.push(palette[(byte>>6)&1]())
				this.tiles.push(palette[byte>>7]())
			}
		}else if(palettelen <= 4){
			for(;j<1024;j++){
				const byte = buf.byte()
				this.tiles.push(palette[byte&3]())
				this.tiles.push(palette[(byte>>2)&3]())
				this.tiles.push(palette[(byte>>4)&3]())
				this.tiles.push(palette[byte>>6]())
			}
		}else if(palettelen <= 16){
			for(;j<2048;j++){
				const byte = buf.byte()
				this.tiles.push(palette[byte&15]())
				this.tiles.push(palette[(byte>>4)]())
			}
		}else if(palettelen <= 256){
			for(;j<4096;j++){
				this.tiles.push(palette[buf.byte()]())
			}
		}else{
			for(;j<6144;j+=3){
				let byte2
				this.tiles.push(palette[buf.byte() + (((byte2 = buf.byte())&0x0F)<<8)]())
				this.tiles.push(palette[buf.byte() + ((byte2&0xF0)<<4)]())
			}
		}
		//parse block entities
		for(j=0;j<4096;j++){
			const block = this.tiles[j]._
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
			buf.int(e._id | 0)
			buf.short(e._id / 4294967296 | 0)
			buf.string(e.name)
			buf.short(e.state)
			buf.float(e.dx)
			buf.float(e.dy)
			buf.float(e.f)
			if(e._.savedata)buf.flint(e._.savedatahistory.length), buf.write(e._.savedata, e)
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
			let type = this.tiles[i]._.savedata
			if(!type)continue
		}
		return buf
	}
	static of(block, x, y, w){
		return new Chunk(new DataReader(Uint8Array.of(16, x >> 24, x >> 16, x >> 8, x, y >> 24, y >> 16, y >> 8, y, 0, 0, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, block.id >> 8, block.id)), w)
	}
	[Symbol.for('nodejs.util.inspect.custom')](){return '<Chunk x: '+this.x+' y: '+this.y+'>'}
}

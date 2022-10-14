import { Block, BlockIDs } from "../blocks/block.js";
import { DataReader } from "../utils/data.js";

export class Chunk{
	constructor(buffer){
		if(!buffer.left || buffer.byte() != 16)throw new TypeError("Corrupt / Invalid chunk data")
		const x = buffer.int(), y = buffer.int()
		this.x = x << 6 >> 6
		this.y = y << 6 >> 6
		this.tiles = []
		this.entities = new Set()
		if(buffer.left < 1)throw 1
		//read buffer palette
		let palettelen = (x >>> 26) + (y >>> 26) * 64 + 1
		let entitylen = buffer.short()
		let palette = []
		let i = 0
		for(;i<palettelen;i++){
			palette.push(BlockIDs[buffer.short()].original)
		}
		let j = 0; i = 11 + i * 2
		if(palettelen<2){
			for(;j<4096;j++)this.tiles.push(palette[0])
		}else if(palettelen == 2){
			for(;j<512;j++){
				const byte = buffer.byte()
				this.tiles.push(palette[byte&1])
				this.tiles.push(palette[(byte>>1)&1])
				this.tiles.push(palette[(byte>>2)&1])
				this.tiles.push(palette[(byte>>3)&1])
				this.tiles.push(palette[(byte>>4)&1])
				this.tiles.push(palette[(byte>>5)&1])
				this.tiles.push(palette[(byte>>6)&1])
				this.tiles.push(palette[byte>>7])
			}
		}else if(palettelen <= 4){
			for(;j<1024;j++){
				const byte = buffer.byte()
				this.tiles.push(palette[byte&3])
				this.tiles.push(palette[(byte>>2)&3])
				this.tiles.push(palette[(byte>>4)&3])
				this.tiles.push(palette[byte>>6])
			}
		}else if(palettelen <= 16){
			for(;j<2048;j++){
				const byte = buffer.byte()
				this.tiles.push(palette[byte&15])
				this.tiles.push(palette[(byte>>4)])
			}
		}else if(palettelen <= 256){
			for(;j<4096;j++){
				this.tiles.push(palette[buffer.byte()])
			}
		}else{
			for(;j<6144;j+=3){
				let byte2
				this.tiles.push(palette[buffer.byte() + (((byte2 = buffer.byte())&0x0F)<<8)])
				this.tiles.push(palette[buffer.byte() + ((byte2&0xF0)<<4)])
			}
		}
		//parse block entities
		for(j=0;j<4096;j++){
			const block = this.tiles[j]._
			if(!block._savedata)continue
			//decode data
			let data = Object.create(Block.prototype)
			data._ = block
			this.tiles[j] = data
		}
	}
	toPacket(buf){
		let palette = [], palette2 = Object.create(null)
		for(let i = 0; i < 4096; i++){
			let id = this.tiles[i].id
			if(!(id in palette2)){
				palette2[id] = palette.length
				palette.push(id)
			}
		}
		buf.byte(16)
		buf.int((this.x & 0x3ffffff) + ((palette.length-1) << 26))
		buf.int((this.y & 0x3ffffff) + ((palette.length-1) >> 6 << 26))
		buf.short(0)
		for(let i = 0; i < palette.length; i++){
			buf.short(palette[i])
		}
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
			let type = this.tiles[i]._._savedata
			if(!type)continue
		}
		return buf
	}
	static of(block, x, y){
		const chunk = new Chunk(new DataReader(new Uint8Array(Uint32Array.of(369098774, x, y).buffer, 3)))
		let i = 4096;
		while(i--)chunk.tiles.push(block)
		return chunk
	}
	[Symbol.for('nodejs.util.inspect.custom')](){return '<Chunk x: '+this.x+' y: '+this.y+'>'}
}

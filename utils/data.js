import { Item, ItemIDs } from '../items/item.js'

Promise.prototype.reader = function(){return this.then(CONSTRUCT)}
const CONSTRUCT = a => a ? new DataReader(a) : null
const CHARSET = '0123456789ABCDEF'

export const decoder = new TextDecoder()
export const encoder = new TextEncoder()

export class DataReader extends DataView{
	constructor(arr){
		super(arr.buffer, arr.byteOffset, arr.byteLength)
		this.i = 0
	}
	read(type, target){
		switch(type){
			case Uint8: return this.getUint8(this.i++)
			case Int8: return this.getInt8(this.i++)
			case Uint16: return this.getUint16((this.i += 2) - 2)
			case Int16: return this.getInt16((this.i += 2) - 2)
			case Uint32: return this.getUint32((this.i += 4) - 4)
			case Int32: return this.getInt32((this.i += 4) - 4)
			case Float64: return this.getFloat64((this.i += 8) - 8)
			case Float32: return this.getFloat32((this.i += 4) - 4)
			case Boolean: return this.getUint8(this.i++) != 0
			case String: return this.string()
			case Item: return this.item(target)
		}
		if(Array.isArray(type)){
			target = target || []
			if(target.length)target.length = 0
			let len = 0
			if(type.length > 1){
				len = type[1] >>> 0
			}else{
				len = this.getUint8(this.i)
				if(len > 64 && buf.length > 1){
					if(len > 128 && buf.length > 3)len = buf.getUint32(this.i) & 0x7FFFFFFF, this.i += 4
					else len = buf.getUint16(this.i) & 0x3FFF, this.i += 2
				}else len &= 0x3F, this.i++
			}
			while(len--)target.push(this.read(type[0]))
			return target
		}else{
			const obj = target || {}
			for(const j in type)obj[j] = this.read(type[j], obj[j])
			return obj
		}
	}
	byte(){ return this.getUint8(this.i++) }
	uint8(){ return this.getUint8(this.i++) }
	int8(){ return this.getInt8(this.i++) }
	uint16(){ return this.getUint16((this.i+=2)-2) }
	short(){ return this.getUint16((this.i+=2)-2) }
	int16(){ return this.getInt16((this.i+=2)-2) }
	int(){ return this.getInt32((this.i+=4)-4) }
	uint32(){ return this.getUint32((this.i+=4)-4) }
	int32(){ return this.getInt32((this.i+=4)-4) }
	float(){ return this.getFloat32((this.i+=4)-4) }
	float32(){ return this.getFloat32((this.i+=4)-4) }
	double(){ return this.getFloat64((this.i+=8)-8) }
	float64(){ return this.getFloat64((this.i+=8)-8) }
	bool(){return this.getUint8(this.i++) != 0}
	boolean(){return this.getUint8(this.i++) != 0}
	get left(){return this.byteLength - this.i}
	string(){
		let i = this.i
		let len = this.getUint8(i)
		if(len > 64){
			if(len > 128)len = this.getUint32(i) & 0x7FFFFFFF, i += 4
			else len = this.getUint16(i) & 0x3FFF, i += 2
		}else len &= 0x3F, i++
		this.i = i + len
		return decoder.decode(new Uint8Array(this.buffer, i, len))
	}
	item(target){
		const count = this.getUint8(this.i++)
		if(!count)return null
		const item = ItemIDs[this.getUint16(this.i)]
		this.i += 2
		if(!item)return null
		if(!target)target = item(count)
		else target.count = count, target._ = item._
		if(item._.savedata)this.read(item._.savedata, target)
		return target
	}
	pipe(sock){
		sock.send(this)
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		return `DataReader(${this.byteLength - this.i}) [ \x1b[33m${[...new Uint8Array(this.buffer, this.byteOffset, this.byteLength).subarray(this.i, 50)].map(a=>CHARSET[a>>4]+CHARSET[a&15]).join(' ')}\x1b[m${this.byteLength-this.i>50?' ...':''} ]`
	}
}
const ALLOCSIZE = 4096 //Do not try to set this value below 200 or above 100k
const pool = [new DataView(new ArrayBuffer(ALLOCSIZE))]
//Consideration: Because of TCP we cannot reuse buffers, 1 encoding = 1 unique buffer
export class DataWriter extends Array{
	constructor(){
		super()
		this.cur = pool.pop() || new DataView(new ArrayBuffer(ALLOCSIZE))
		this.i = 0
	}
	allocnew(){
		super.push(new Uint8Array(this.cur.buffer, this.cur.byteOffset, this.i))
		this.cur = pool.pop() || new DataView(new ArrayBuffer(ALLOCSIZE))
		this.i = 0
	}
	write(type, v){
		if(this.i > this.cur.byteLength - (type < 7 ? 1 << (type >> 1) : 4))this.allocnew()
		let buf = this.cur
		switch(type){
			case Uint8: buf.setUint8(this.i++, v); return
			case Int8: buf.setInt8(this.i++, v); return
			case Uint16: buf.setUint16((this.i += 2) - 2, v); return
			case Int16: buf.setInt16((this.i += 2) - 2, v); return
			case Uint32: buf.setUint32((this.i += 4) - 4, v); return
			case Int32: buf.setInt32((this.i += 4) - 4, v); return
			case Float64: buf.setFloat64((this.i += 8) - 8, v); return
			case Float32: buf.setFloat32((this.i += 4) - 4, v); return
			case Boolean: buf.setUint8(this.i++, v); return
			case String:
				const len = v.length
				if(len > 0x3FFF){
					if(len <= 0x7FFFFFFF)throw new RangeError('Encoded strings may not have more than 2147483647 characters')
					else buf.setUint32((this.i += 4) - 4, len + 0x80000000)
				}else if(len > 0x3F)buf.setUint16((this.i += 2) - 2, len + 0x4000)
				else buf.setUint8(this.i++, len)
				const {read, written} = encoder.encodeInto(v, new Uint8Array(buf.buffer, buf.byteOffset + this.i))
				if(read == v.length){
					this.i += written
					return
				}
				v = v.slice(read)
				super.push(new Uint8Array(buf.buffer, buf.byteOffset, this.i))
				if(v.length <= Math.floor(ALLOCSIZE / 3)){
					buf = this.cur = pool.pop() || new DataView(new ArrayBuffer(ALLOCSIZE))
					this.i = encoder.encodeInto(v, new Uint8Array(buf.buffer, buf.byteOffset)).written
				}else{
					super.push(encoder.encode(v))
					this.cur = pool.pop() || new DataView(new ArrayBuffer(ALLOCSIZE))
					this.i = 0
				}
				return
			case Item:
				if(!v){buf.setUint8(this.i++, 0); return}
				buf.setUint8(this.i++, v.count)
				buf.setUint16(this.i, v.id); this.i += 2
				if(v._.savedata)this.write(v._.savedata, v)
				return
		}
		if(Array.isArray(type)){
			let len
			if(type.length > 1)len = type[1]
			else{
				len = v.length
				if(len > 0x3FFF){
					if(len <= 0x7FFFFFFF)throw new RangeError('Encoded arrays may not have more than 2147483647 items')
					else buf.setUint32((this.i += 4) - 4, len + 0x80000000)
				}else if(len > 0x3F)buf.setUint16((this.i += 2) - 2, len + 0x4000)
				else buf.setUint8(this.i++, len)
			} 
			for(let i = 0; i < len; i++)this.write(type[0], v[i])
		}else{
			for(const j in type)this.write(type[j], v[j])
		}
	}
	//Bear with me, these are hot functions that NEED to be 100% inlined
	byte(n){ if(this.i == this.cur.byteLength)this.allocnew(); this.cur.setUint8(this.i++, n) }
	uint8(n){ if(this.i == this.cur.byteLength)this.allocnew(); this.cur.setUint8(this.i++, n) }
	int8(n){ if(this.i == this.cur.byteLength)this.allocnew(); this.cur.setInt8(this.i++, n) }
	short(n){ if(this.i > this.cur.byteLength - 2)this.allocnew(); this.cur.setUint16((this.i+=2)-2, n) }
	uint16(n){ if(this.i > this.cur.byteLength - 2)this.allocnew(); this.cur.setUint16((this.i+=2)-2, n) }
	int16(n){ if(this.i > this.cur.byteLength - 2)this.allocnew(); this.cur.setInt16((this.i+=2)-2, n) }
	int(n){ if(this.i > this.cur.byteLength - 4)this.allocnew(); this.cur.setInt32((this.i+=4)-4, n) }
	uint32(n){ if(this.i > this.cur.byteLength - 4)this.allocnew(); this.cur.setUint32((this.i+=4)-4, n) }
	int32(n){ if(this.i > this.cur.byteLength - 4)this.allocnew(); this.cur.setInt32((this.i+=4)-4, n) }
	float(n){ if(this.i > this.cur.byteLength - 4)this.allocnew(); this.cur.setFloat32((this.i+=4)-4, n) }
	float32(n){ if(this.i > this.cur.byteLength - 4)this.allocnew(); this.cur.setFloat32((this.i+=4)-4, n) }
	double(n){ if(this.i > this.cur.byteLength - 8)this.allocnew(); this.cur.setFloat64((this.i+=8)-8, n) }
	float64(n){ if(this.i > this.cur.byteLength - 8)this.allocnew(); this.cur.setFloat64((this.i+=8)-8, n) }
	bool(n){ if(this.i == this.cur.byteLength)this.allocnew(); this.cur.setUint8(this.i++, n) }
	boolean(n){ if(this.i == this.cur.byteLength)this.allocnew(); this.cur.setUint8(this.i++, n) }
	string(v){
		if(this.i > this.cur.byteLength - 4)this.allocnew()
		const len = v.length
		let buf = this.cur
		if(len > 0x3FFF){
			if(len <= 0x7FFFFFFF)throw new RangeError('Encoded strings may not have more than 2147483647 characters')
			else buf.setUint32((this.i += 4) - 4, len + 0x80000000)
		}else if(len > 0x3F)buf.setUint16((this.i += 2) - 2, len + 0x4000)
		else buf.setUint8(this.i++, len)
		const {read, written} = encoder.encodeInto(v, new Uint8Array(buf.buffer, buf.byteOffset + this.i))
		if(read == v.length){
			this.i += written
			return
		}
		v = v.slice(read)
		super.push(new Uint8Array(buf.buffer, buf.byteOffset, this.i))
		if(v.length <= Math.floor(ALLOCSIZE / 3)){
			buf = this.cur = pool.pop() || new DataView(new ArrayBuffer(ALLOCSIZE))
			this.i = encoder.encodeInto(v, new Uint8Array(buf.buffer, buf.byteOffset)).written
		}else{
			super.push(encoder.encode(v))
			this.cur = pool.pop() || new DataView(new ArrayBuffer(ALLOCSIZE))
			this.i = 0
		}
	}
	item(v){
		if(this.i > this.cur.byteLength - 3)this.allocnew();
		if(!v){this.cur.setUint8(this.i++, 0); return}
		this.cur.setUint8(this.i++, v.count)
		this.cur.setUint16(this.i, v.id); this.i += 2
		if(v._.savedata)this.write(v._.savedata, v)
	}
	pipe(sock){
		for(const b of this) sock.send(b, {fin: false})
		sock.send(new Uint8Array(this.cur.buffer, this.cur.byteOffset, this.i))
		if(this.cur.byteLength - this.i >= Math.ceil(ALLOCSIZE / 3)){
			pool.push(new DataView(this.cur.buffer, this.cur.byteOffset + this.i))
			this.cur = new DataView(this.cur.buffer, this.cur.byteOffset, this.i)
		}
	}
	build(paddingStart = 0, paddingEnd = 0){
		let len = paddingStart + paddingEnd + this.i
		for(const b of this)len += b.byteLength
		const buf = new Uint8Array(len)
		let i = paddingStart
		for(const b of this){
			buf.set(new Uint8Array(b.buffer, b.byteOffset, b.byteLength), i)
			i += b.byteLength
		}
		buf.set(new Uint8Array(this.cur.buffer, this.cur.byteOffset, this.i), i)
		if(this.cur.byteLength - this.i >= Math.ceil(ALLOCSIZE / 3)){
			pool.push(new DataView(this.cur.buffer, this.cur.byteOffset + this.i))
			this.cur = new DataView(this.cur.buffer, this.cur.byteOffset, this.i)
		}
		return buf
	}
	[Symbol.for('nodejs.util.inspect.custom')](){
		let len = this.i, b = Uint8Array.of()
		for(b of this)len += b.byteLength
		return `DataWriter(${len}) [ ${len>50?'... ':''}\x1b[33m${[...b.slice(this.i-50 || b.length), ...new Uint8Array(this.cur.buffer, this.cur.byteOffset, this.cur.byteLength).slice(Math.max(0, this.i-50),this.i)].map(a=>CHARSET[a>>4]+CHARSET[a&15]).join(' ')}\x1b[m ]`
	}
}
let flt = new Float32Array(1)
globalThis.Double = globalThis.Float64 = Number
globalThis.Float = globalThis.Float32 = a=>{flt[0]=a;return flt[0]}
globalThis.Int = globalThis.Int32 = a => a | 0
globalThis.Short = globalThis.UInt16 = globalThis.Uint16 = a => a & 65535
globalThis.Byte = globalThis.UInt8 = globalThis.Uint8 = a => a & 255
globalThis.Uint32 = globalThis.UInt32 = a => a >>> 0
globalThis.Int16 = a => a << 16 >> 16
globalThis.Int8 = a => a << 24 >> 24
globalThis.Bool = Boolean

const types = [Byte, Int8, Short, Int16, Uint32, Int32, Float, Double, Boolean, String, Item]
export const typeToJson = type => JSON.stringify(type, (k, v) => typeof v == 'object' ? v : typeof v == 'function' ? types.indexOf(v) : typeof v == 'number' && k == '1' ? v : undefined)
export const jsonToType = json => JSON.parse(json, (k, v) => typeof v == 'object' ? v : typeof v == 'number' ? k == '1' ? v : types[v] : undefined)
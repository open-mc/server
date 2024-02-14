export const decoder = new TextDecoder()
export const encoder = new TextEncoder()

export class DataReader extends DataView{
	constructor(arr){
		if(arr instanceof ArrayBuffer)super(arr)
		else super(arr.buffer, arr.byteOffset, arr.byteLength)
		this.i = 0
	}
	read(type, target){
		if(!type) return target
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
			case Uint8Array: return this.uint8array()
		}
		if(typeof type == 'function'){
			if(typeof type.decode == 'function') return type.decode(this, target)
			throw 'Type is not encodable'
		}
		if(Array.isArray(type)){
			let len = 0; target = target || []
			if(type.length > 1){
				target.length = len = type[1] >>> 0
				Object.seal(target)
			}else{
				len = this.getUint8(this.i)
				if(len >= 64){
					if(len >= 128)len = this.getUint32(this.i) & 0x7FFFFFFF, this.i += 4
					else len = this.getUint16(this.i) & 0x3FFF, this.i += 2
				}else this.i++
				target.length = len
			}
			let i = 0
			while(i < len)target[i++] = this.read(type[0])
			return target
		}else{
			const obj = target || {}
			for(const j in type)obj[j] = this.read(type[j], obj[j])
			return obj
		}
	}
	readVer(history, target){ return this.read(history[Math.min(history.length - 1, this.flint())], target) }
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
	flint(){
		let n = this.getUint8(this.i)
		if(n >= 64){
			if(n >= 128)n = this.getUint32(this.i) & 0x7FFFFFFF, this.i += 4
			else n = this.getUint16(this.i) & 0x3FFF, this.i += 2
		}else this.i++
		return n
	}
	flint2(){
		let n = this.getUint8(this.i)
		if(n >= 128) n = this.getUint16(this.i) & 0x7FFF, this.i += 2
		else this.i++
		return n
	}
	uint8array(len = -1){
		let i = this.i
		if(len < 0){
			len = this.getUint8(i)
			if(len >= 64){
				if(len >= 128)len = this.getUint32(i) & 0x7FFFFFFF, i += 4
				else len = this.getUint16(i) & 0x3FFF, i += 2
			}else i++
		}
		this.i = i + len
		return new Uint8Array(this.buffer, this.byteOffset + i, len)
	}
	string(){
		let i = this.i
		let len = this.getUint8(i)
		if(len >= 64){
			if(len >= 128)len = this.getUint32(i) & 0x7FFFFFFF, i += 4
			else len = this.getUint16(i) & 0x3FFF, i += 2
		}else i++
		this.i = i + len
		return decoder.decode(new Uint8Array(this.buffer, this.byteOffset + i, len))
	}
	
	get left(){ return this.byteLength - this.i }
	[Symbol.for('nodejs.util.inspect.custom')](){
		return `DataReader(${this.byteLength - this.i}) [ \x1b[33m${[...new Uint8Array(this.buffer, this.byteOffset, this.byteLength).subarray(this.i, 50)].map(a=>'0123456789ABCDEF'[a>>4]+'0123456789ABCDEF'[a&15]).join(' ')}\x1b[m${this.byteLength-this.i>50?' ...':''} ]`
	}
}
const ALLOCSIZE = 4096 //Do not try to set this value below 200 or above 100k
const pool = [new DataView(new ArrayBuffer(ALLOCSIZE))]
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
		if(!type) return
		let buf = this.cur
		switch(type){
			case Uint8: if(this.i == this.cur.byteLength) this.allocnew(); buf.setUint8(this.i++, v); return
			case Int8: if(this.i == this.cur.byteLength) this.allocnew(); buf.setInt8(this.i++, v); return
			case Uint16: if(this.i > this.cur.byteLength - 2) this.allocnew(); buf.setUint16((this.i += 2) - 2, v); return
			case Int16: if(this.i > this.cur.byteLength - 2) this.allocnew(); buf.setInt16((this.i += 2) - 2, v); return
			case Uint32: if(this.i > this.cur.byteLength - 4) this.allocnew(); buf.setUint32((this.i += 4) - 4, v); return
			case Int32: if(this.i > this.cur.byteLength - 4) this.allocnew(); buf.setInt32((this.i += 4) - 4, v); return
			case Float64: if(this.i > this.cur.byteLength - 8) this.allocnew(); buf.setFloat64((this.i += 8) - 8, v); return
			case Float32: if(this.i > this.cur.byteLength - 4) this.allocnew(); buf.setFloat32((this.i += 4) - 4, v); return
			case Boolean: if(this.i == this.cur.byteLength) this.allocnew(); buf.setUint8(this.i++, v); return
			case String: this.string(v); return
			case Uint8Array: this.uint8array(v); return
		}
		if(typeof type == 'function'){
			if(typeof type.encode == 'function') return type.encode(this, v)
			throw 'Type is not encodable'
		}
		if(Array.isArray(type)){
			let len
			if(type.length > 1)len = type[1]
			else{
				len = v.length
				if(this.i > this.cur.byteLength - 1 - (len > 63)*3) this.allocnew()
				if(len > 0x3FFF){
					if(len > 0x7FFFFFFF)throw new RangeError('Encoded arrays may not have more than 2147483647 items')
					else buf.setUint32((this.i += 4) - 4, len | 0x80000000)
				}else if(len > 0x3F)buf.setUint16((this.i += 2) - 2, len | 0x4000)
				else buf.setUint8(this.i++, len)
			} 
			for(let i = 0; i < len; i++)this.write(type[0], v[i])
		}else{
			for(const j in type)this.write(type[j], v[j])
		}
	}
	writeVer(history, v){ return this.flint(history.length-1), this.write(history[history.length-1], v) }
	
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
	flint(n){
		if(this.i > this.cur.byteLength - 4)this.allocnew()
		if(n > 0x3FFF){
			if(n > 0x7FFFFFFF)throw new RangeError('n > 2147483647')
			else this.cur.setUint32((this.i += 4) - 4, n | 0x80000000)
		}else if(n > 0x3F)this.cur.setUint16((this.i += 2) - 2, n | 0x4000)
		else this.cur.setUint8(this.i++, n)
	}
	flint2(n){
		if(this.i > this.cur.byteLength - 2)this.allocnew()
		if(n > 0x7F){
			if(n > 0x7FFF)throw new RangeError('n > 32767')
			else this.cur.setUint16((this.i += 2) - 2, n | 0x8000)
		}else this.cur.setUint8(this.i++, n)
	}
	uint8array(v, len = -1){
		if(len < 0){
			len = v.length
			if(this.i > this.cur.byteLength - 4)this.allocnew()
			if(len > 0x3FFF){
				if(len > 0x7FFFFFFF)throw new RangeError('Encoded strings may not have more than 2147483647 characters')
				else this.cur.setUint32((this.i += 4) - 4, len | 0x80000000)
			}else if(len > 0x3F)this.cur.setUint16((this.i += 2) - 2, len | 0x4000)
			else this.cur.setUint8(this.i++, len)
		}else if(len != v.length) throw 'Length of encoded Uint8Array does not match required length'

		const buf = this.cur
		const avail = buf.byteLength - this.i
		if(len <= avail){
			new Uint8Array(buf.buffer, buf.byteOffset).set(v, this.i)
			this.i += len
			return
		}
		new Uint8Array(buf.buffer, buf.byteOffset + this.i).set(v.subarray(0, avail), 0)
		this.i += avail
		this.allocnew()
		const left = len - avail
		if(left < avail && left < (this.cur.byteLength >> 1)){
			//Small enough to copy to next chunk
			new Uint8Array(this.cur.buffer, this.cur.byteOffset).set(v.subarray(avail), 0)
			this.i = left
		}else super.push(v.subarray(avail))
	}
	string(v){
		if(this.i > this.cur.byteLength - 4)this.allocnew()
		const encoded = encoder.encode(v)
		const len = encoded.length
		const buf = this.cur
		if(len > 0x3FFF){
			if(len > 0x7FFFFFFF)throw new RangeError('Encoded strings may not have more than 2147483647 characters')
			else buf.setUint32((this.i += 4) - 4, len | 0x80000000)
		}else if(len > 0x3F)buf.setUint16((this.i += 2) - 2, len | 0x4000)
		else buf.setUint8(this.i++, len)
		const avail = buf.byteLength - this.i
		if(len <= avail){
			new Uint8Array(buf.buffer, buf.byteOffset).set(encoded, this.i)
			this.i += len
			return
		}
		new Uint8Array(buf.buffer, buf.byteOffset).set(encoded.subarray(0, avail), this.i)
		this.i += avail
		this.allocnew()
		const left = len - avail
		if(left < avail && left <= this.cur.byteLength){
			//Small enough to copy to next chunk, freeing encoded
			new Uint8Array(this.cur.buffer, this.cur.byteOffset).set(encoded.subarray(avail), 0)
			this.i = left
		}else super.push(encoded.subarray(avail))
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
		let len = this.i, b = []
		for(b of this)len += b.byteLength
		return `DataWriter(${len}) [ ${len>50?'... ':''}\x1b[33m${[...b.slice(this.i-50 || b.length), ...new Uint8Array(this.cur.buffer, this.cur.byteOffset, this.cur.byteLength).slice(Math.max(0, this.i-50),this.i)].map(a=>'0123456789ABCDEF'[a>>4]+'0123456789ABCDEF'[a&15]).join(' ')}\x1b[m ]`
	}
}
globalThis.Double = globalThis.Float64 = Number
globalThis.Float = globalThis.Float32 = Math.fround
globalThis.Int = globalThis.Int32 = a => a | 0
globalThis.Short = globalThis.Uint16 = a => a & 65535
globalThis.Byte = globalThis.Uint8 = a => a & 255
globalThis.Uint32 = a => a >>> 0
globalThis.Int16 = a => a << 16 >> 16
globalThis.Int8 = a => a << 24 >> 24
globalThis.Bool = Boolean
globalThis.DataReader = DataReader
globalThis.DataWriter = DataWriter
const types = [Byte, Int8, Short, Int16, Uint32, Int32, Float, Double, Boolean, String, Uint8Array]
const typesReverse = new Map()
for(let i in types) typesReverse.set(types[i], i)
export function registerTypes(dict){
	for(const k in dict){
		types[k] = dict[k]
		typesReverse.set(dict[k], k)
	}
}
export const typeToJson = type => JSON.stringify(type, (_, v) => typeof v == 'object' || typeof v == 'number' || typeof v == 'string' ? v : typeof v == 'function' ? typesReverse.get(v) : undefined)
export const jsonToType = json => JSON.parse(json, (_, v) => typeof v == 'object' || typeof v == 'number' ? v : typeof v == 'string' ? types[v] : undefined)

export const Encodable = (dec,enc) => {
	const fn = ()=>{throw 'Not constructable'}
	fn.decode = dec; fn.encode = enc
	return fn
}
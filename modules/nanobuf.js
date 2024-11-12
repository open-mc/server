export const decoder = new TextDecoder()
export const encoder = new TextEncoder()

globalThis.TypedArray ??= Object.getPrototypeOf(Uint8Array)
export class BufReader extends DataView{
	/**  */
	constructor(arr){
		if(arr instanceof ArrayBuffer) super(arr)
		else super(arr.buffer, arr.byteOffset, arr.byteLength)
		this.i = this.bitState = 0
	}
	decode(t,v){ return t.decode(this,v) }
	b1(){
		let a = this.bitState
		if(a<2) try{a=this.getUint8(this.i++)|256}catch{a=256}
		this.bitState = a>>1; return a&1
	}
	b2(){
		let a = this.bitState
		if(a<4) try{a=a&(a=+(a<2))|(this.getUint8(this.i++)|256)<<a}catch{a=256<<a}
		this.bitState = a>>2; return a&3
	}
	b4(){
		let a = this.bitState
		if(a<16){
			let x = -21936>>(a<<1)&3;
			try{a=a&7>>(3-x)|(this.getUint8(this.i++)|256)<<x}catch{a=256<<x}
		}
		this.bitState = a>>4; return a&15
	}
	u8(){ try{return this.getUint8(this.i++)}catch{return 0} }
	i8(){ try{return this.getInt8(this.i++)}catch{return 0} }
	u16(){ try{return this.getUint16((this.i+=2)-2)}catch{return 0} }
	i16(){ try{return this.getInt16((this.i+=2)-2)}catch{return 0} }
	u24(){ try{return this.getUint8(this.i)<<16|this.getUint16((this.i+=3)-2)}catch{return 0} }
	i24(){ try{return this.getInt8(this.i)<<16|this.getUint16((this.i+=3)-2)}catch{return 0} }
	u32(){ try{return this.getUint32((this.i+=4)-4)}catch{return 0} }
	i32(){ try{return this.getInt32((this.i+=4)-4)}catch{return 0} }
	u48(){ try{return this.getUint16((this.i+=6)-6)*4294967296+this.getUint32(this.i-4)}catch{return 0} }
	i48(){ try{return this.getInt16((this.i+=6)-6)*4294967296+this.getUint32(this.i-4)}catch{return 0} }
	u64(){ try{return this.getUint32((this.i+=8)-8)*4294967296+this.getUint32(this.i-4)}catch{return 0} }
	i64(){ try{return this.getInt32((this.i+=8)-8)*4294967296+this.getUint32(this.i-4)}catch{return 0} }
	bu64(){ try{return this.getBigUint64((this.i+=8)-8)}catch{return 0} }
	bi64(){ try{return this.getBigInt64((this.i+=8)-8)}catch{return 0} }
	f32(){ try{return this.getFloat32((this.i+=4)-4)}catch{return 0} }
	f64(){ try{return this.getFloat64((this.i+=8)-8)}catch{return 0} }
	bool(){ try{return this.getUint8(this.i++) != 0}catch{return 0} }
	v64(){ try{
		const n = this.getUint8(this.i++)
		if(n < 64) return n
		if(n >= 128) return (this.getUint32((this.i += 7)-8)&0x7FFFFFFF)*4294967296+this.getUint32(this.i-4)
		if(n >= 96) return this.getUint32((this.i += 3)-4)&0x1FFFFFFF
		return this.getUint8(this.i++)|n<<8&0x1FFF
	}catch{return 0} }
	bv64(){ try{
		let n = this.getUint8(this.i++)
		if(n >= 64){
			if(n >= 128) return this.getBigUint64((this.i+=7)-8)&0x7FFFFFFFFFFFFFFFn
			n = n >= 96 ? this.getUint32((this.i += 3)-4)&0x1FFFFFFF : this.getUint8(this.i++)|n<<8&0x1FFF
		}
		return BigInt(n)
	}catch{return 0} }
	v32(){ try{
		const n = this.getUint8(this.i++)
		if(n < 64) return n
		if(n >= 128) return this.getUint32((this.i += 3)-4) & 0x7FFFFFFF
		return this.getUint8(this.i++)|n<<8&0x3FFF
	}catch{return 0} }
	v16(){ try{
		const n = this.getUint8(this.i++)
		return n < 128 ? n : this.getUint8(this.i++)|n<<8&0x3FFF
	}catch{return 0} }
	/** Advance a number of bytes. Useful for padding */
	skip(n){ this.i += n }
	u8arr(len = -1){ try{
		let i = this.i
		if(len < 0){
			len = this.getUint8(i++)
			if(len >= 64){
				if(len >= 128)len = this.getUint32(i) & 0x7FFFFFFF, i += 3
				else len = this.getUint8(this.i++)|n<<8&0x3FFF
			}
		}
		this.i = i + len
		return new Uint8Array(this.buffer.slice(i+=this.byteOffset, len))
	}catch{return new Uint8Array()} }
	str(){
		let i = this.i
		let len = this.getUint8(i++)
		if(len >= 64){
			if(len >= 128)len = this.getUint32(i) & 0x7FFFFFFF, i += 3
			else len = this.getUint8(this.i++)|n<<8&0x3FFF
		}
		this.i = i + len
		return decoder.decode(new Uint8Array(this.buffer, this.byteOffset + i, len))
	}
	enum({intToStr, defaultString}){
		let n = this.getUint8(this.i++)
		if(n > 64){
			if(n >= 128) n = this.getUint32((this.i += 3)-4) & 0x7FFFFFFF
			else n = this.getUint8(this.i++)|n<<8&0x3FFF
		}
		return intToStr[n]??defaultString
	}
	/** Returns a mutable Uint8Array view of the next bytes */
	view(size=0){ return new Uint8Array(this.buffer, this.byteOffset+(this.i+=size)-size, size) }
	/** How many bytes have been read from this buffer so far */
	get read(){ return this.i }
	/** How many more bytes can be read before reaching the end of the buffer */
	get remaining(){ return this.byteLength - this.i }
	/** Whether we have reached and passed the end of the buffer. All read functions will return "null" values (i.e, 0, "", Uint8Array(0)[], false, ...) */
	get overran(){ return this.i>this.byteLength }
	/** Get a Uint8Array pointing to remaining unread data. This is a reference and not a copy. Use Uint8Array.slice() to turn it into a copy */
	toUint8Array(){ return new Uint8Array(this.buffer,this.byteOffset+this.i,this.byteLength-this.i) }
	/** Copies all the bytes that have already been read since this object's creation into a new ArrayBuffer */
	copyReadToArrayBuffer(){ return this.buffer.slice(this.byteOffset,this.byteOffset+this.i) }
	/** Copies all the bytes yet to be read into a new ArrayBuffer */
	copyRemainingToArrayBuffer(){ return this.buffer.slice(this.byteOffset+this.i,this.byteOffset+this.byteLength) }
	/** Same as new BufWriter(this.copyReadToArrayBuffer(), this.i) */
	copyToWriter(){ return new BufWriter(this.buffer.slice(this.byteOffset, this.byteOffset+this.i), this.i) }
	/** Same as new BufReader(this.copyRemainingToArrayBuffer()) */
	copy(){ return new BufReader(this.buffer.slice(this.byteOffset+this.i,this.byteOffset+this.byteLength)) }
	[Symbol.for('nodejs.util.inspect.custom')](){
		let str = `BufReader(${this.byteLength - this.i}) [ \x1b[33m`
		let {i} = this; const end = (i+50>this.byteLength?this.byteLength:i+50)
		while(i<end){
			const a = this.getUint8(i++)
			str += '0123456789abcdef'[a>>4]+'0123456789abcdef'[a&15]+' '
		}
		return str += `\x1b[m${this.byteLength>end?'... ':''}]`
	}
}
const {floor, trunc, fround} = Math
export class BufWriter{
	/** Construct a new BufWriter, optionally passing the underlying ArrayBuffer and head position. Once the head surpasses the ArrayBuffer's length, it is discarded (and possibly detached) and a new ArrayBuffer is allocated and used */
	constructor(arr = new ArrayBuffer(64), head = 0){
		this.buf = new DataView(arr)
		this.buf8 = new Uint8Array(arr)
		this.i = head<=(this.cap=arr.byteLength)?head:this.cap
		this.bitState = 0
	}
	_grow(n = 0){
		const r = new Uint8Array(new ArrayBuffer(this.cap=(this.cap<<1)+n))
		r.set(this.buf8, 0)
		this.buf = new DataView(r.buffer)
		this.buf8 = r
	}
	encode(t,v){return t.encode(this,v)}
	b1(n=0){
		let a=this.bitState
		if(!(a&7)){
			if(this.i >= this.cap) this._grow()
			a = this.i<<3
			this.buf8[this.i++] = 0
		}
		this.buf8[a>>>3] |= n<<(a&7); this.bitState = a+1
	}
	b2(n=0){
		let a=this.bitState,b=a&7
		if(b){
			this.buf8[a>>>3] |= n<<b
			if(b<7){this.bitState=a+2;return}
			a = b = 1
		}else a = 2
		if(this.i >= this.cap) this._grow()
		this.bitState = a|this.i<<3
		this.buf8[this.i++] = n>>b
	}
	b4(n=0){
		let a=this.bitState,b=a&7
		if(b){
			this.buf8[a>>>3] |= n<<b
			if(b<5){this.bitState=a+4;return}
			a = b-4; b = 8-b
		}else a = 4
		if(this.i >= this.cap) this._grow()
		this.bitState = a|this.i<<3
		this.buf8[this.i++] = n>>b
	}
	u8(n=0){ if(this.i >= this.cap)this._grow(); this.buf8[this.i++] = n }
	i8(n=0){ if(this.i >= this.cap)this._grow(); this.buf8[this.i++] = n }
	u16(n=0){ if((this.i+=2) > this.cap)this._grow(); this.buf8[this.i-2] = n>>8; this.buf8[this.i-1] = n }
	i16(n=0){ if((this.i+=2) > this.cap)this._grow(); this.buf8[this.i-2] = n>>8; this.buf8[this.i-1] = n }
	u24(n=0){ if((this.i+=3) > this.cap)this._grow(); this.buf8[this.i-3] = n>>16; this.buf8[this.i-2] = n>>8; this.buf8[this.i-1] = n }
	i24(n=0){ if((this.i+=3) > this.cap)this._grow(); this.buf8[this.i-3] = n>>16; this.buf8[this.i-2] = n>>8; this.buf8[this.i-1] = n }
	u32(n=0){ if((this.i+=4) > this.cap)this._grow(); this.buf.setUint32(this.i-4, n) }
	i32(n=0){ if((this.i+=4) > this.cap)this._grow(); this.buf.setInt32(this.i-4, n) }
	u48(n=0){ if((this.i+=6) > this.cap)this._grow(); this.buf.setUint16(this.i-6, floor(trunc(n)/4294967296)); this.buf.setInt32(this.i-4, n|0) }
	i48(n=0){ if((this.i+=6) > this.cap)this._grow(); this.buf.setInt16(this.i-6, floor(trunc(n)/4294967296)); this.buf.setInt32(this.i-4, n|0) }
	u64(n=0){ if((this.i+=8) > this.cap)this._grow(); this.buf.setUint32(this.i-8, floor(trunc(n)/4294967296)); this.buf.setInt32(this.i-4, n|0) }
	i64(n=0){ if((this.i+=8) > this.cap)this._grow(); this.buf.setInt32(this.i-8, floor(trunc(n)/4294967296)); this.buf.setInt32(this.i-4, n|0) }
	bu64(n=0n){ if((this.i+=8) > this.cap)this._grow(); this.buf.setBigUint64(this.i-8, n) }
	bi64(n=0n){ if((this.i+=8) > this.cap)this._grow(); this.buf.setBigInt64(this.i-8, n) }
	f32(n=0){ if((this.i+=4) > this.cap)this._grow(); this.buf.setFloat32(this.i-4, n) }
	f64(n=0){ if((this.i+=8) > this.cap)this._grow(); this.buf.setFloat64(this.i-8, n) }
	bool(n=false){ if(this.i >= this.cap)this._grow(); this.buf8[this.i++] = n }
	// 1xxxxxxx (+7B)
	// 011xxxxx (+3B)
	// 010xxxxx (+1B)
	// 00xxxxxx
	v64(n=0){
		if(this.i > this.cap-8) this._grow()
		if(n > 0x3F){
			if(n > 0x1FFFFFFF) this.buf.setUint32((this.i += 8) - 8, floor(trunc(n)/4294967296) | 0x80000000), this.buf.setInt32(this.i - 4, n|0)
			else if(n > 0x1FFF) this.buf.setInt32((this.i += 4) - 4, n | 0x60000000)
			else this.buf8[this.i++] = n>>8|64, this.buf8[this.i++] = n
		}else this.buf8[this.i++] = n<0?0:n
	}
	bv64(bn=0n){
		if(this.i > this.cap-8) this._grow()
		const n = Number(bn)
		if(n > 0x3F){
			if(n > 0x1FFFFFFF) this.buf.setBigUint64((this.i += 8) - 8, bn | 0x8000000000000000n)
			else if(n > 0x1FFFn) this.buf.setInt32((this.i += 4) - 4, n | 0x60000000)
			else this.buf8[this.i++] = n>>8|64, this.buf8[this.i++] = n
		}else this.buf8[this.i++] = n<0?0:n
	}
	// 1xxxxxxx (+3B)
	// 01xxxxxx (+1B)
	// 00xxxxxx
	v32(n=0){
		if(this.i > this.cap-4) this._grow()
		if(n > 0x3F){
			if(n > 0x3FFF) this.buf.setInt32((this.i += 4) - 4, n | 0x80000000)
			else this.buf8[this.i++] = n>>8|64, this.buf8[this.i++] = n
		}else this.buf8[this.i++] = n<0?0:n
	}
	// 1xxxxxxx (+1B)
	// 0xxxxxxx
	v16(n=0){
		if(this.i > this.cap-2) this._grow()
		if(n > 0x7F) this.buf8[this.i++] = n>>8|128, this.buf8[this.i++] = n
		else this.buf8[this.i++] = n>=0?n:0
	}
	u8arr(v, n = -1){
		if(!(v instanceof Uint8Array)){
			if(v instanceof BufWriter) v = v.buf8.subarray(0, v.i)
			else{if(this.i >= this.cap) this._grow(); this.buf8[this.i++] = 0;return}
		}
		if(n < 0){
			n = v.byteLength
			if(n>2147483647){if(this.i >= this.cap) this._grow(); this.buf8[this.i++] = 0;return}
			if(this.i > this.cap-4-n) this._grow(n)
			if(n > 0x3FFF){
				if(n > 0x7FFFFFFF) this.buf8[this.i++] = n = 0
				else this.buf.setInt32((this.i += 4) - 4, n | 0x80000000)
			}else if(n > 0x3F) this.buf8[this.i++] = n>>8|64, this.buf8[this.i++] = n
			else this.buf8[this.i++] = n
		}else if(this.i > this.cap-n) this._grow(n)
		this.buf8.set(v, this.i); this.i += n
	}
	/** Advance a number of bytes. Useful for padding */
	skip(n=0){ if((this.i+=n) > this.cap) this._grow(n) }
	str(v=''){
		if(this.i > this.cap-4) this._grow()
		const encoded = encoder.encode(v)
		let n = encoded.length
		if(n>2147483647){if(this.i >= this.cap) this._grow(); this.buf8[this.i++] = 0;return}
		if(this.i > this.cap-4-n) this._grow(n)
		if(n > 0x3FFF){
			if(n > 0x7FFFFFFF) this.buf8[this.i++] = n = 0
			else this.buf.setInt32((this.i += 4) - 4, n | 0x80000000)
		}else if(n > 0x3F) this.buf8[this.i++] = n>>8|64, this.buf8[this.i++] = n
		else this.buf8[this.i++] = n
		new Uint8Array(this.buffer).set(encoded, this.i); this.i += n
	}
	enum({strToInt, default: d}, str){
		if(this.i > this.cap-4) this._grow()
		const n = strToInt.get(str)??d
		if(n > 0x3F){
			if(n > 0x3FFF) this.buf.setInt32((this.i += 4) - 4, n | 0x80000000)
			else this.buf8[this.i++] = n>>8|64, this.buf8[this.i++] = n
		}else this.buf8[this.i++] = n<0?0:n
	}
	/** How many bytes have been written to this buffer so far */
	get written(){ return this.i }
	/** The underlying array buffer that is being modified. May be larger than this.written (this is intentional to avoid excessive reallocations). May become detached as writer grows */
	get buffer(){ return this.buf.buffer }
	// Always 0
	get byteOffset(){ return 0 }
	// Same as .written
	get byteLength(){ return this.i }
	/** View into the currently written data. May become detached as writer grows, consider using a copying method */
	toUint8Array(){ return this.buf8.subarray(0,this.i) }
	/** Reader for the currently written data. May become detached as writer grows, consider using a copying method */
	toReader(){ return new BufReader(this) }
	/** Get a copy of the written data as an ArrayBuffer */
	copyToArrayBuffer(){ return this.buf8.buffer.slice(0,this.i) }
	/** Get a copy of the written data as a second BufWriter */
	copy(){ return new BufWriter(this.buf.buffer.slice(0,this.i), this.i) }
	/** Same as new BufReader(this.copyToArrayBuffer()) */
	copyToReader(){ return new BufReader(this.buf8.buffer.slice(0,this.i)) }
	[Symbol.for('nodejs.util.inspect.custom')](){
		let {i} = this, str = `BufWriter(${i}) [ ${i>50?(i-=50,'... '):(i=0,'')}\x1b[33m`
		while(i<this.i){
			const a = this.buf8[i++]
			str += '0123456789abcdef'[a>>4]+'0123456789abcdef'[a&15]+' '
		}
		return str += `\x1b[m]`
	}
}
if('transfer' in ArrayBuffer.prototype) BufWriter.prototype._grow = function(n=0){ this.buf = new DataView(this.buf.buffer.transfer(this.cap=(this.cap<<1)+n)) }
// Feds are coming, watch out!
let encodable = (f,e,d,s) => (f.encode=e,f.decode=d,f.size=s,f)
export const b1 = encodable((a=0) => +!!a, (buf,a) => buf.b1(a), (buf,_) => buf.b1(),0)
export const b2 = encodable((a=0) => (typeof a=='number'?a:Number(a))&3, (buf,a) => buf.b2(a), (buf,_) => buf.b2(),0)
export const b4 = encodable((a=0) => (typeof a=='number'?a:Number(a))&15, (buf,a) => buf.b4(a), (buf,_) => buf.b4(),0)
export const u8 = encodable((a=0) => (typeof a=='number'?a:Number(a))&255, (buf,a) => buf.u8(a), (buf,_) => buf.u8(),1)
export const i8 = encodable((a=0) => (typeof a=='number'?a:Number(a))<<24>>24, (buf,a) => buf.i8(a), (buf,_) => buf.i8(),1)
export const u16 = encodable((a=0) => (typeof a=='number'?a:Number(a))&65535, (buf,a) => buf.u16(a), (buf,_) => buf.u16(),2)
export const i16 = encodable((a=0) => (typeof a=='number'?a:Number(a))<<16>>16, (buf,a) => buf.i16(a), (buf,_) => buf.i16(),2)
export const u24 = encodable((a=0) => (typeof a=='number'?a:Number(a))&16777215, (buf,a) => buf.u24(a), (buf,_) => buf.u24(),3)
export const i24 = encodable((a=0) => (typeof a=='number'?a:Number(a))<<8>>8, (buf,a) => buf.i24(a), (buf,_) => buf.i24(),3)
export const u32 = encodable((a=0) => (typeof a=='number'?a:Number(a))>>>0, (buf,a) => buf.u32(a), (buf,_) => buf.u32(),4)
export const i32 = encodable((a=0) => (typeof a=='number'?a:Number(a))|0, (buf,a) => buf.i32(a), (buf,_) => buf.i32(),4)
export const u48 = encodable((a=0) => (floor(trunc(a=(typeof a=='number'?a:Number(a)))/4294967296)&65535)*4294967296+(a>>>0), (buf,a) => buf.u48(a), (buf,_) => buf.u48(),6)
export const i48 = encodable((a=0) => (floor(trunc(a=(typeof a=='number'?a:Number(a)))/4294967296)<<16>>16)*4294967296+(a>>>0), (buf,a) => buf.i48(a), (buf,_) => buf.i48(),6)
export const u64 = encodable((a=0) => (floor(trunc(a=(typeof a=='number'?a:Number(a)))/4294967296)>>>0)*4294967296+(a>>>0), (buf,a) => buf.u64(a), (buf,_) => buf.u64(),8)
export const i64 = encodable((a=0) => (floor(trunc(a=(typeof a=='number'?a:Number(a)))/4294967296)|0)*4294967296+(a>>>0), (buf,a) => buf.i64(a), (buf,_) => buf.i64(),8)
export const bu64 = encodable((a=0n) => (typeof a=='bigint'?a:BigInt(a))&0xFFFFFFFFFFFFFFFFn, (buf,a) => buf.bu64(a), (buf,_) => buf.bu64(),8)
export const bi64 = encodable((a=0n) => BigInt.asIntN(64, typeof a=='bigint'?a:BigInt(a)), (buf,a) => buf.bi64(a), (buf,_) => buf.bi64(),8)
export const f32 = encodable((a=0) => fround(typeof a=='number'?a:Number(a)), (buf,a) => buf.f32(a), (buf,_) => buf.f32(),4)
export const f64 = encodable((a=0) => typeof a=='number'?a:Number(a), (buf,a) => buf.f64(a), (buf,_) => buf.f64(),8)
export const v16 = encodable((a=0) => (a=typeof a=='number'?a:Number(a))<0?0:a&32767, (buf,a) => buf.v16(a), (buf,_) => buf.v16(),1)
export const v32 = encodable((a=0) => (a=typeof a=='number'?a:Number(a))<0?0:a&2147483647, (buf,a) => buf.v32(a), (buf,_) => buf.v32(),1)
export const v64 = encodable((a=0) => (typeof a=='number'?a:Number(a))<0?0:a%9223372036854775808, (buf,a) => buf.v32(a), (buf,_) => buf.v32(),1)
export const bv64 = encodable((a=0n) => (typeof a=='bigint'?a:BigInt(a))<0n?0n:a&0x7FFFFFFFFFFFFFFFn, (buf,a) => buf.v32(a), (buf,_) => buf.v32(),1)
export const u8arr = encodable(a => {try{const b = typeof a == 'string' ? encoder.encode(a) : new Uint8Array(a.buffer ? a.buffer.slice(a.byteOffset, a.byteLength) : a instanceof ArrayBuffer ? a.slice(0,2147483647) : a);return b.byteLength>2147483647?b.subarray(0,2147483647):b}catch{return new Uint8Array()}}, (buf,a) => buf.u8arr(a), (buf,_) => buf.u8arr(),1)
u8arr.len = len => ((len=floor(len))>=0||(len=0), encodable(a => a instanceof ArrayBuffer ? new Uint8Array(a.byteLength >= len ? a.slice(0, len) : len) : new Uint8Array(a?.length === len ? a : len), (buf,a) => buf.u8arr(a, len), (buf,_) => buf.u8arr(len),len))
export const str = encodable((a='') => a+'', (buf,a) => buf.str(a), (buf,_) => buf.str(),1)
export const bool = encodable(a => !!a, (buf,a) => buf.bool(a), (buf,_) => buf.bool(),1)

export let Struct = (obj, f) => {
	const fparams = [], f1ret = [], f2bod = [], f3bod = [], f3ret = []
	let i = 0, sz = 0
	const os = {}
	for(const k in obj){
		let n = /^[a-zA-Z$_][a-zA-Z0-9$_]*$/.test(k) ? k : JSON.stringify(k)
		fparams.push(n+':a'+i)
		f1ret.push(n+':this.a'+i+'(a'+i+')')
		f2bod.push('this.a'+i+'.encode(b,a'+i+')')
		f3ret.push(''+n+':this.a'+i+'.decode(b)')
		n = (n.length==k.length?'v.'+n:'v['+n+']')
		f3bod.push(n+'=this.a'+i+'.decode(b,'+n+')')
		sz += (os['a'+i++] = obj[k]).size??0
	}
	const f1bod = `return{${f1ret}}`
	f ??= new Struct.constructor(`{${fparams}}={}`, f1bod).bind(os)
	f.encode = new Struct.constructor(`b,{${fparams}}={}`, f2bod.join(';')).bind(os)
	f.decode = new Struct.constructor(`b,v`, `if(!v)return {${f3ret}};${f3bod.join(';')};return v`).bind(os)
	f.size = sz
	f.of = new Struct.constructor(Object.keys(os), f1bod).bind(os)
	return f
}
try{new Struct.constructor('')}catch{Struct = obj => encodable(a => {
	const o = {}
	for(const k in obj) o[k] = obj[k](a[k])
	return o
}, (buf, v={}) => {for(const k in obj) obj[k].encode(buf, v[k])},
(buf, v={}) => {for(const k in obj) v[k]=obj[k].decode(buf, v[k]);return v})}
export const Arr = (type, len = -1) => {
	(len=floor(len))>=0||(len=-1)
	const f=encodable(a => {
	const arr = []
	try{for(const el of a) arr.push(type(el))}catch{}
	if(len >= 0){
		if(arr.length > len) arr.length = len
		else while(arr.length < len) arr.push(type())
	}else if(arr.length > 2147483647) arr.length = 2147483647
	return arr
}, (buf, v=[]) => {
	const l = len < 0 ? (buf.v32(v.length),v.length) : len
	for(let i = 0; i < l; i++) type.encode(buf, v[i])
}, (buf, v) => {
	const l = len < 0 ? buf.v32() : len
	if(v) for(let i = 0; i < l; i++) v[i] = type.decode(buf, v[i])
	else{ v = []; for(let i = l; --i>=0;) v.push(type.decode(buf)) }
	return v
}, len<0?1:(type.size??0)*len);f.of=(...a)=>f(a);return f}

export const Optional = t => encodable(a => a==null?null:t(a), (buf,v) => {
	if(v==null) buf.u8(0)
	else buf.u8(1),t.encode(buf,v)
}, (buf, v) => buf.u8() ? t.decode(buf, v) : null, 1)

export const Enum = (v=[], def=undefined) => {
	const map = new Map, rmap = []
	if(Array.isArray(v)) for(let i=0;i<v.length;i++) map.set(v[i]+'',i), rmap[i] = v[i]
	else for(const k in v){const j=v[k]&2147483647;map.set(k, j);rmap[j]=k}
	if(typeof def!='string') def=map.keys().next().value??''
	let none = -1; while(rmap[++none]);
	const f = encodable(a => typeof a=='string'?map.get(a)??none:Number(a)&2147483647, (buf,a) => buf.v32(typeof a=='string'?map.get(a)??none:a), (buf, _) => rmap[buf.v32()]??def, 1)
	f.strToInt = map; f.intToStr = rmap; f.default = none; f.defaultString = def
	return f
}

export const Padding = (sz=0) => encodable(() => undefined, (buf,_) => buf.skip(sz), (buf, _) => (buf.i+=sz,undefined), sz)
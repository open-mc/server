import { WebSocket, WebSocketServer, Sender } from 'ws'

async function a(){}
globalThis.AsyncFunction = a.constructor

Object.defineProperties(Array.prototype, {
	winner: {enumerable: false, value(pred){
		let best = -Infinity
		let winner = null
		const length = this.length
		for(let i = 0; i < length; i++){
			const a = this[i], score = pred(a, i, this)
			if(score > best){
				best = score
				winner = a
			}
		}
		return winner
	}},
	remove: {enumerable: false, value(a){
		let i = 0, j = 0
		for(; j < this.length; j++){
			if(j > i)this[i] = this[j]
			if(this[i] != a)i++
		}
		this.length = i
		return this
	}},
	mutmap: {enumerable: false, value(fn){
		const len = this.length
		for(let i = 0; i < len; i++)
			this[i] = fn(this[i])
		return this
	}}
})
WebSocket.prototype[Symbol.for('nodejs.util.inspect.custom')] = function(){return '<WebSocket \x1b[33m'+this._socket.remoteAddress+'\x1b[m>'}
WebSocketServer.prototype[Symbol.for('nodejs.util.inspect.custom')] = function(){return '<WebSocketServer clients: \x1b[33m'+this.clients.size+'\x1b[m>'}

Math.ifloat = x => {
	const f = Math.floor(x)
	return (f | 0) + (x - f)
}
Math.ifloor = x => Math.floor(x) | 0

/*//PERF!!!
WebSocket.prototype.send = function(data, cb){
	if (this.readyState !== WebSocket.OPEN){
		throw new Error('WebSocket is not open: readyState '+this.readyState)
	}
	const {_sender, _socket} = this
	let opcode = 2
	if(typeof data === 'string')data = encoder.encode(data), opcode = 1
	let byteLength = data.byteLength

	if (opcode == 2) data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

	if (_sender._firstFragment) _sender._compress = false
	else opcode = 0
	_sender._firstFragment = true
	let offset = 2, payloadLength = byteLength
	if (byteLength >= 65536){
		offset += 8
		payloadLength = 127
	} else if (byteLength > 125){
		offset += 2
		payloadLength = 126
	}
	const target = Buffer.allocUnsafe(offset)
	target[0] = opcode | 0x80
	target[1] = payloadLength
	if (payloadLength === 126){
		target.writeUInt16BE(byteLength, 2)
	} else if (payloadLength === 127){
		target[2] = target[3] = 0
		target.writeUIntBE(byteLength, 4, 6)
	}
	_socket.cork()
	_socket.write(target)
	_socket.write(data)
	_socket.uncork()
}*/

// Blazingly fast!!
const nul = new Array(1000).fill(null)
Array.null = len => {
	if(len <= 1000) return nul.slice(0, len)
	let a = new Array(len)
	while(len > 0) a[--len] = null
	return a
}
Function.returns = v => () => v

Date.formatTime = function(t){
	t /= 1000
	if(t < 3600){
		if(t >= 60) return floor(t/60)+'m '+floor(t%60)+'s'
		else if(t >= 1) return floor(t)+'s'
		else return t*1000+'ms'
	}else{
		if(t < 86400) return floor(t/3600)+'h '+floor(t%3600/60)+'m'
		else if(t < 8640000) return floor(t/86400)+'d '+floor(t%86400/3600)+'h'
		else return floor(t/86400)+'d'
	}
}
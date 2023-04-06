import { fs, stats } from './internals.js'
import util from 'node:util'
import { WebSocket, WebSocketServer } from 'ws'
import { Dimensions, players } from './world/index.js'
import { chat, LIGHT_GREY, ITALIC, YELLOW } from './misc/chat.js'
import { commands, err } from './misc/commands.js'
import { input, repl } from 'basic-repl'
import { codes, onstring } from './misc/incomingPacket.js'
import { CONFIG, HANDLERS, packs, PERMISSIONS } from './config.js'
import { DataReader, DataWriter } from './utils/data.js'
import { playerLeft, playerLeftQueue, queue } from './misc/queue.js'
import crypto from 'node:crypto'
import { deflateSync } from 'node:zlib'
import { entityindex } from './entities/index.js'
import { itemindex } from './items/index.js'
import { blockindex } from './blocks/index.js'
import { Entities } from './entities/entity.js'
import { Items } from './items/item.js'

const PUBLICKEY = `-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEA1umjA6HC1ZqCFRSVK1Pd3iSVl82m3UYvSOeZOJgL/yaYnWx47hvo
sXS9GkNjgfl3WATBJ33Q/cigpAi9svLoQgcgkIH+UlMTIJhvuuZ1JK7L6zLwPfyY
s4slcfqVjjC3KsD4Neu2kI9DAw696yiDlSrGFlgVG2GHYjOx1N60CALkKm4oJh1w
dAcg25lE9hao850GIDYqD44BkmbP6KAN1YN0lfyHRwCxmrkNPoFrg5dN1UkwEmnC
gnhKtGgJDdv3MweRrgkyz0aethcpcCF17xlXwszJn/Nyvc+E7+8XIRSbFglij0ei
KOp/re6t/rgyqmjdxEWoXXptl9pjeVnJbwIDAQAB
-----END RSA PUBLIC KEY-----`

/**
 * @param {Request} req
 * @param {Response} res
 */
const handler = (req, res) => {
	res.setHeader('Location', 'https://preview.openmc.pages.dev/?ws'+(key&&pem?'s://':'://') + req.headers.host)
	res.writeHead(301)
	res.end('')
}

const {key, pem} = CONFIG
export const httpServer = key && pem ? (await import('https')).createServer(handler, {
	key: await fs.readFile(key[0]=='/'||key[0]=='~' ? key : PATH + '../' + key),
	cert: await fs.readFile(pem[0]=='/'||pem[0]=='~' ? pem : PATH + '../' + pem)
}) : (await import('http')).createServer(handler)

export const server = new WebSocketServer({server: httpServer, perMessageDeflate: false})

export let started = 0

server.once('listening', () => {
	progress(`Everything Loaded. \x1b[1;33mServer listening on port ${server.address().port+(key&&pem?' (secure)':'')}\x1b[m\nType /help for a list of commands, or press tab to switch to repl`)
	started = Date.now()
	repl('[server] ', async text => {
		if(text == 'clear') return clear()
		if(text[0] == '/'){
			try{
				let args = text.slice(1).match(/"(?:[^\\"]|\\.)*"|[^"\s]\S*|"/g).map((a,i)=>{
					try{
						return a[0] == '"' ? JSON.parse(a) : a
					}catch(e){ throw 'failed parsing argument '+i }
				})
				if(!(args[0] in commands))throw 'no such command: /'+args[0]
				let res = commands[args[0]].apply(server, args.slice(1))
				if(res)console.log(res)
			}catch(e){ console.log('\x1b[31m'+err(e)+'\x1b[m'); return}
		}else{
			process.stdout.write('\x1b[A')
			input(false)
			chat('[server] ' + text, LIGHT_GREY + ITALIC)
		}
	})
	repl('$ ', async _ => _ == 'clear' ? clear() : console.log(util.inspect(await eval(_),false,5,true)))
})


WebSocket.prototype.logMalicious = function(reason){
	if(!CONFIG.logMalicious) return
	console.warn('\x1b[33m' + this._socket.remoteAddress + ' made a malicious packet: ' + reason)
}

const indexCompressed = (b => new Uint8Array(b.buffer, b.byteOffset, b.byteLength))(deflateSync(Buffer.from(blockindex + '\0' + itemindex + '\0' + entityindex + packs.map(a=>'\0'+a).join(''))))

const playersConnecting = new Set()

server.on('connection', function(sock, {url}){
	if(exiting) return
	let [, username, pubKey, authSig] = url.split('/').map(decodeURIComponent)
	if(!username || !pubKey || !authSig)return sock.logMalicious('Malformed Connection'), sock.close()
	sock.player = null
	sock.username = username
	sock.packets = []
	sock.pubKey = pubKey
	if(!crypto.verify('SHA256', Buffer.from(username + '\n' + pubKey), PUBLICKEY, Buffer.from(authSig, 'base64')))
		return sock.logMalicious('Invalid public key signature'), sock.close()
	crypto.randomBytes(32, (err, rnd) => {
		if(err) return sock.close()
		sock.challenge = rnd
		const buf = new DataWriter()
		buf.string(CONFIG.name)
		buf.string(CONFIG.motd[floor(random() * CONFIG.motd.length)])
		buf.string(CONFIG.icon)
		buf.uint8array(indexCompressed)
		buf.uint8array(rnd)
		buf.pipe(sock)
		sock.on('message', message)
	})
})
async function play(sock, username, skin){
	if(exiting) return
	if(CONFIG.maxplayers && players.size + playersConnecting.size >= CONFIG.maxplayers){
		sock.on('close', playerLeftQueue)
		if(await queue(sock)) return sock.close()
		sock.removeListener('close', playerLeftQueue)
	}
	let permissions = PERMISSIONS[username] || PERMISSIONS.default_permissions || 2
	if(permissions*1000 > Date.now()){
		sock.send(permissions == 2147483647 ? '-119You are permanently banned from this server':'-119You are banned from this server for '
			+ Date.formatTime(permissions*1000-Date.now())+(CONFIG.ban_appeal_info?'\nBan appeal: '+CONFIG.ban_appeal_info:''))
		sock.close()
		return
	}else if(permissions == 0){
		sock.send('-11fYou are not invited to play on this server')
		sock.close()
		return
	}else if(permissions == 9){
		sock.send('-10fYour permissions were not correctly set up!\nPlease contact a server admin to fix this issue')
		sock.close()
		return
	}
	let player, dim
	let other = players.get(username)
	if(other){
		other.sock.send('-119You are logged in from another session')
		other.sock.player = null
		other.sock.close()
		other.sock = null
		dim = other.world
		other.remove()
		player = other
	}else if(playersConnecting.has(username)){
		sock.send('-119You are still logging in/out from another session')
		sock.logMalicious('Connect / disconnect shamble')
		sock.close()
		return
	}else try{
		playersConnecting.add(username)
		const buf = await HANDLERS.LOADFILE('players/'+username).reader()
		playersConnecting.delete(username)
		if(sock.readyState !== sock.OPEN)return
		player = Entities.player(buf.double(), buf.double())
		dim = Dimensions[buf.string()]
		player.state = buf.short()
		player.dx = buf.float(); player.dy = buf.float(); player.f = buf.float()
		player.age = buf.double()
		buf.read(player.savedatahistory[buf.flint()] || player.savedata, player)
		other = null
	}catch(e){
		player = Entities.player(0, 20)
		dim = Dimensions.overworld
		player.inv[0] = Items.stone(20)
		player.inv[1] = Items.oak_log(20)
		player.inv[2] = Items.oak_planks(20)
		player.inv[3] = Items.tnt(10)
		player.inv[4] = Items.flint_and_steel()
		player.inv[5] = Items.obsidian(64)
		player.inv[6] = Items.grass(32)
		player.inv[7] = Items.diamond_pickaxe()
		player.inv[8] = Items.diamond_shovel()
		player.inv[9] = Items.netherrack(10)
		player.inv[10] = Items.sandstone(10)
	}
	player.interface = null; player.interfaceId = 0
	player.skin = skin
	player.sock = sock
	player.name = username
	sock.permissions = permissions
	sock.movePacketCd = Date.now() - 1000
	player.place(dim)
	players.set(username, player)
	sock.r = 255
	player.rubber(0)
	sock.player = player
	if(!other) chat(username + (other === null ? ' joined the game' : ' joined the server'), YELLOW)
	sock.ebuf = new DataWriter()
	sock.ebuf.byte(20)
	sock.tbuf = new DataWriter()
	sock.tbuf.byte(8)
	sock.on('close', close)
	sock.on('error', e => sock.logMalicious('Caused an error: \n'+e.stack))
}

server.sock = {permissions: 3}
server.world = Dimensions.overworld

export const close = async function(){
	const {player} = this
	if(!player) return
	players.delete(player.name)
	playersConnecting.add(player.name)
	const buf = new DataWriter()
	buf.double(player.x)
	buf.double(player.y)
	buf.string(player.world?.id ?? 'overworld')
	buf.short(player.state)
	buf.float(player.dx)
	buf.float(player.dy)
	buf.float(player.f)
	buf.double(player.age)
	if(player.savedata) buf.flint(player.savedatahistory.length), buf.write(player.savedata, player)
	if(!exiting) chat(player.name + ' left the game', YELLOW)
	await HANDLERS.SAVEFILE('players/' + player.name, buf.build())
	playersConnecting.delete(player.name)
	playerLeft()
	player.remove()
}

const message = function(_buf, isBinary){
	const {player} = this
	if(!player && this.challenge && isBinary){
		if(_buf.length <= 1008) return
		if(crypto.verify('SHA256', this.challenge, '-----BEGIN RSA PUBLIC KEY-----\n' + this.pubKey + '\n-----END RSA PUBLIC KEY-----', _buf.subarray(1008))){
			play(this, this.username, _buf.subarray(0, 1008))
		}else{
			this.send('-119Invalid signature')
			this.close()
			this.logMalicious('Invalid signature')
		}
		return
	}else if(!player) return
	if(!isBinary) return void onstring.call(this, player, _buf.toString())
	const buf = new DataReader(_buf) //let your code breathe
	const code = buf.byte()
	if(!codes[code]) return
	try{
		codes[code].call(this, player, buf)
	}catch(e){ this.logMalicious('Caused an error: \n'+e.stack) }
}
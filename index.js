import fs from 'fs/promises'
import { stats } from './internals.js'
import util from 'util'
import { WebSocketServer } from 'ws'
import { Dimensions, players } from './world/index.js'
import { chat, LIGHT_GREY, ITALIC, YELLOW } from './misc/chat.js'
import { commands, err, formatTime } from './misc/commands.js'
import './utils/prototypes.js'
import { input, repl } from 'basic-repl'
import { codes, onstring } from './misc/incomingPacket.js'
import { CONFIG, HANDLERS, packs, PERMISSIONS, TPS } from './config.js'
import { Entities, EntityIDs } from './entities/entity.js'
import { ItemIDs, Items } from './items/item.js'
import { BlockIDs, Blocks } from './blocks/block.js'
import { DataReader, DataWriter } from './utils/data.js'
import { setTPS } from './world/tick.js'
import { playerLeft, playerLeftQueue, queue } from './misc/queue.js'
import crypto from 'crypto'
import { deflateSync } from 'zlib'

let total = 5, loaded = -1, promise = null
globalThis.started = Math.round(Date.now() - performance.now())
globalThis.progress = function(desc){
	loaded++
	console.log(`\x1b[1A\x1b[9999D\x1b[2K\x1b[32m[${'#'.repeat(loaded)+' '.repeat(total - loaded)}] (${formatTime(Date.now() - started)}) ${desc}`)
	if(total == loaded + 1)promise()
}
process.stdout.write('\x1bc\x1b[3J')
progress('Modules loaded')
let blockidx, itemidx, entityidx
import('./blocks/index.js').then(({blockindex}) => {
	blockidx = blockindex
	progress(`${EntityIDs.length} Blocks loaded`)
})
import('./items/index.js').then(({itemindex}) => {
	itemidx = itemindex
	progress(`${ItemIDs.length} Items loaded`)
})
import('./entities/index.js').then(({entityindex}) => {
	entityidx = entityindex
	progress(`${BlockIDs.length} Entities loaded`)
})
function uncaughtErr(e){
	const l = process.stdout.columns
	console.log('\n\x1b[31m'+'='.repeat(Math.max(0,Math.floor(l / 2 - 8)))+' Critical Error '+'='.repeat(Math.max(0,Math.ceil(l / 2 - 8)))+'\x1b[m\n\n' 
		+ (e && (e.stack || e.message || e)) + '\n\x1b[31m'+'='.repeat(l)+'\n' + ' '.repeat(Math.max(0,Math.floor(l / 2 - 28))) + 'Join our discord for help: https://discord.gg/NUUwFNUHkf')
	//process.exit(0)
}
process.on('uncaughtException', uncaughtErr)
process.on('unhandledRejection', uncaughtErr)
const clear = () => process.stdout.write('\x1bc\x1b[3J')
await new Promise(r => promise = r)

export let server
if(CONFIG.key && CONFIG.pem){
	const {createServer} = await import('https')
	const httpsServer = createServer({key: await fs.readFile(CONFIG.key[0] == '/' || CONFIG.key[0] == '~' ? CONFIG.key : PATH + '../' + CONFIG.key), cert: await fs.readFile(CONFIG.pem[0] == '/' || CONFIG.pem[0] == '~' ? CONFIG.pem : PATH + '../' + CONFIG.pem)})
	server = new WebSocketServer({server: httpsServer, perMessageDeflate: false})
	httpsServer.listen(CONFIG.port || 27277)
}else server = new WebSocketServer({port: CONFIG.port || 27277, perMessageDeflate: false})

server.on('listening', () => {
	progress(`Everything Loaded. \x1b[1;33mServer listening on port ${server.address().port}\x1b[m\nType /help for a list of commands, or press tab to switch to repl`)
	started = Date.now()
	process.stdin.setRawMode(true)
	process.stdin.resume()
	process.stdin.setEncoding('utf-8')
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
packs.push('/cli/index.js')
const indexCompressed = (b => new Uint8Array(b.buffer, b.byteOffset, b.byteLength))(deflateSync(Buffer.from(blockidx + '\0' + itemidx + '\0' + entityidx + '\0' + packs.join('\0'))))
const PUBLICKEY = `-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEA1umjA6HC1ZqCFRSVK1Pd3iSVl82m3UYvSOeZOJgL/yaYnWx47hvo
sXS9GkNjgfl3WATBJ33Q/cigpAi9svLoQgcgkIH+UlMTIJhvuuZ1JK7L6zLwPfyY
s4slcfqVjjC3KsD4Neu2kI9DAw696yiDlSrGFlgVG2GHYjOx1N60CALkKm4oJh1w
dAcg25lE9hao850GIDYqD44BkmbP6KAN1YN0lfyHRwCxmrkNPoFrg5dN1UkwEmnC
gnhKtGgJDdv3MweRrgkyz0aethcpcCF17xlXwszJn/Nyvc+E7+8XIRSbFglij0ei
KOp/re6t/rgyqmjdxEWoXXptl9pjeVnJbwIDAQAB
-----END RSA PUBLIC KEY-----`

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
		buf.string(CONFIG.motd[Math.floor(Math.random() * CONFIG.motd.length)])
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
			+ formatTime(permissions*1000-Date.now())+(CONFIG.ban_appeal_info?'\nBan appeal: '+CONFIG.ban_appeal_info:''))
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
		buf.read(player.savedatahistory[buf.flint()] || player.savedata, player)
		other = null
	}catch(e){
		player = Entities.player(0, 0)
		dim = Dimensions.overworld
		player.inv[0] = Items.stone(1)
		player.inv[1] = Items.sandstone(2)
		player.inv[2] = Items.oak_log(3)
		player.inv[3] = Items.oak_planks(4)
		player.inv[4] = Items.netherrack(1)
		player.inv[5] = Items.obsidian(1)
	}
	player.interface = null; player.interfaceId = 0
	player.skin = skin
	player.sock = sock
	player.ebuf = new DataWriter()
	player.ebuf.byte(20)
	player.name = username
	player.permissions = permissions
	player.place(dim)
	players.set(username, player)
	player.r = 255
	player.rubber(0)
	sock.player = player
	if(!other) chat(username + (other === null ? ' joined the game' : ' joined the server'), YELLOW)
	sock.on('close', close)
	sock.on('error', e => sock.logMalicious('Caused an error: \n'+e))
}

server.permissions = 3
server.world = Dimensions.overworld

const close = async function(){
	const {player} = this
	if(!player) return
	players.delete(player.name)
	playersConnecting.add(player.name)
	const buf = new DataWriter()
	buf.double(player.x)
	buf.double(player.y)
	buf.string(player.world.id)
	buf.short(player.state)
	buf.float(player.dx)
	buf.float(player.dy)
	buf.float(player.f)
	buf.flint(player.savedatahistory.length)
	buf.write(player.savedata, player)
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
	if(!isBinary) return void onstring(player, _buf.toString())
	const buf = new DataReader(_buf) //let your code breathe
	const code = buf.byte()
	if(!codes[code]) return
	try{
		codes[code](player, buf)
	}catch(e){ this.logMalicious('Caused an error: \n'+e) }
}
setTPS(TPS)

let exiting = false
process.on('SIGINT', _ => {
	//Save stuff here
	if(exiting) return console.log('\x1b[33mTo force shut down the server, evaluate \x1b[30mprocess.exit(0)\x1b[33m in the repl\x1b[m')
	console.log('\x1b[33mShutting down gracefully...\x1b[m')
	server.close()
	exiting = true
	const promises = []
	for(const sock of server.clients) promises.push(close.call(sock))
	saveAll(process.exit, promises)
})

function saveAll(cb, promises = []){	
	for(const name in Dimensions){
		const d = Dimensions[name]
		promises.push(HANDLERS.SAVEFILE('dimensions/'+name+'.json', JSON.stringify({tick: d.tick})))
		for (const ch of d.values()) d.save(ch)
	}
	Promise.all(promises).then(cb)
}

const timeout = () => setTimeout(saveAll, 120e3, timeout) //Every 2min
timeout()
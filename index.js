import { stats, util } from './internals.js'
import { WebSocketServer } from 'ws'
import { Dimensions } from './world/dimensions.js'
import { chat, LIGHT_GREY, ITALIC } from './misc/chat.js'
import { commands } from './misc/commands.js'
import './utils/prototypes.js'
import { Entities, EntityIDs } from './entities/entity.js'
import { input, repl } from 'basic-repl'
import { codes, string, types } from './misc/incomingPacket.js'
import { CONFIG, HANDLERS, PERMISSIONS, TPS } from './config.js'
import { ItemIDs } from './items/item.js'
import { BlockIDs } from './blocks/block.js'
import { DataReader, DataWriter } from './utils/data.js'
import { setTPS } from './world/tick.js'

export const players = new Map()
let total = 5, loaded = -1, p = null
let started = Math.round(Date.now() - performance.now())
console.edit = function(...a){process.stdout.write('\x1b[1A\x1b[9999D\x1b[2K'); console.log(...a) }
globalThis.progress = function(desc){
	loaded++
	console.edit(`\x1b[32m[${'#'.repeat(loaded)+' '.repeat(total-loaded)}] (${formatTime(Date.now()-started)}) ${desc}`)
	if(total == loaded + 1)p()
}
process.stdout.write('\x1bc\x1b[3J')
progress('Modules loaded')
import('./entities/index.js').then(()=>progress(`${EntityIDs.length} Entities loaded`))
import('./items/index.js').then(()=>progress(`${ItemIDs.length} Items loaded`))
import('./blocks/index.js').then(()=>progress(`${BlockIDs.length} Blocks loaded`))
function err(e){
	const l = process.stdout.columns
	console.log('\n\x1b[31m'+'='.repeat(Math.max(0,Math.floor(l / 2 - 8)))+' Critical Error '+'='.repeat(Math.max(0,Math.ceil(l / 2 - 8)))+'\x1b[m\n')
	console.log(e)
	console.log('\x1b[31m'+'='.repeat(l)+'\n' + ' '.repeat(Math.max(0,Math.floor(l / 2 - 28))) + 'Join our discord for help: https://discord.gg/NUUwFNUHkf')
	process.exit(0)
}
process.on('uncaughtException', err)
process.on('unhandledRejection', err)
const clear = () => process.stdout.write('\x1bc\x1b[3J')
await new Promise(r=>p=r)
export const server = new WebSocketServer({port: CONFIG.port || 27277, perMessageDeflate: false})
server.on('listening', () => {
	progress(`Everything Loaded. \x1b[1;33mServer listening on port ${server.address().port}\x1b[m`)
	started = Date.now()
	process.stdin.setRawMode(true)
	process.stdin.resume()
	process.stdin.setEncoding('utf-8')
	repl('$ ', async _ => _ == 'clear' ? clear() : console.log(util.inspect(await eval(_),false,5,true)))
	repl('[server] ', async text => {
		if(text == 'clear')return clear()
		if(text[0] == '/'){
			try{
				let args = text.slice(1).match(/"(?:[^\\"]|\\.)*"|[^"\s]\S*|"/g).map((a,i)=>{
					try{return a[0]=='"'?JSON.parse(a):a}catch(e){throw 'failed parsing argument '+i}
				})
				if(!(args[0] in commands))throw 'no such command: /'+args[0]
				let res = commands[args[0]].apply(server, args.slice(1))
				res && console.log(res)
			}catch(e){ console.log('\x1b[31m'+e+'\x1b[m'); return}
		}else{
			process.stdout.write('\x1b[A')
			input(false)
			chat('[server] ' + text, LIGHT_GREY + ITALIC)
		}
	})
})

players[Symbol.for('nodejs.util.inspect.custom')] = function(){
	let a = '\x1b[32m' + this.size + '\x1b[m player'+(this.size==1?'':'s')+':'
	for(let p of this){
		a += '\n' + p[1]
	}
	return a
}
function formatTime(a){
	a /= 1000
	if(a < 3600){
		if(a >= 60)return Math.floor(a/60)+'m '+Math.floor(a%60)+'s'
		else if(a >= 1)return Math.floor(a)+'s'
		else return a*1000+'ms'
	}else{
		if(a < 86400)return Math.floor(a/3600)+'h '+Math.floor(a%3600/60)+'m'
		else if(a < 864000)return Math.floor(a/86400)+'d '+Math.floor(a%86400/3600)+'h'
		else return Math.floor(a/86400)+'d'
	}
}

const playersConnecting = new Set()
server.on('connection', async function(sock, {url}){
	let [, username, token] = url.split('/').map(decodeURI)
	//verify token
	//for now, allow

	let permissions = (PERMISSIONS[username]||PERMISSIONS.default)
	if(permissions*1000 > Date.now()){
		sock.send(permissions==2147483647 ? '-119You are permanently banned from this server':'-119You are banned from this server for '+formatTime(permissions*1000-Date.now())+(CONFIG.ban_appeal_info?'\nBan appeal: '+CONFIG.ban_appeal_info:''))
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
	let player
	let other = players.get(username)
	if(other){
		other.sock.send('-119You are logged in from another session')
		other.sock.player = null
		other.sock.close()
		other.remove()
		player = other
		let buffer = new DataWriter()
		buffer.byte(1)
		buffer.double(player.x)
		buffer.double(player.y)
		buffer.string(player.world.id)
		buffer.int(player._id | 0)
		buffer.short(player._id / 4294967296 | 0)
		buffer.float(player.dx)
		buffer.float(player.dy)
		buffer.float(player.f)
		buffer.write(Entities.player._.savedata, player)
		buffer.pipe(sock)
	}else if(playersConnecting.has(username)){
		sock.send('-119You are still logging in/out from another session')
		sock.close()
		return
	}else try{
		playersConnecting.add(username)
		let buffer = await HANDLERS.LOADFILE('players/'+username).reader()
		playersConnecting.delete(username)
		if(sock.readyState !== sock.OPEN)return
		if(buffer.byte() != 1)throw 'Invalid/Corrupt playerdata!'
		player = Entities.player(buffer.double(), buffer.double(), Dimensions[buffer.string()])
		buffer.setUint32(buffer.i, player._id), buffer.setUint16((buffer.i += 6) - 2, player._id / 4294967296 | 0)
		player.dx = buffer.float(); player.dy = buffer.float(); player.f = buffer.float()
		buffer.read(Entities.player._.savedata, player)
		buffer.pipe(sock)
	}catch(e){
		player = Entities.player(0, 0, Dimensions.overworld)
		player.inv = [], player.health = 20
		let i = 41
		while(i--)player.inv.push(null)
		let buffer = new DataWriter()
		buffer.byte(1)
		buffer.double(player.x)
		buffer.double(player.y)
		buffer.string(player.world.id)
		buffer.int(player._id | 0)
		buffer.short(player._id / 4294967296 | 0)
		buffer.float(player.dx)
		buffer.float(player.dy)
		buffer.float(player.f)
		buffer.write(Entities.player._.savedata, player)
		buffer.pipe(sock)
	}
	player.r = 0
	player.sock = sock
	player.name = username
	player.permissions = permissions
	player.init()
	players.set(username, player)
	sock.player = player
	sock.on('close', close)
	sock.on('message', message)
	sock.on('error', console.error)
})

server.permissions = 3
server.world = Dimensions.overworld

const close = async function(){
	const {player} = this
	if(!player)return
	players.delete(player.name)
	playersConnecting.add(player.name)
	const buf = new DataWriter()
	buf.byte(1)
	buf.double(player.x)
	buf.double(player.y)
	buf.string(player.world.id)
	buf.int(0)
	buf.short(0)
	buf.float(player.dx)
	buf.float(player.dy)
	buf.float(player.f)
	buf.write(Entities.player._.savedata, player)
	await HANDLERS.SAVEFILE('players/' + player.name, buf.build())
	playersConnecting.delete(player.name)
	player.remove()
}

const message = function(_buf, isBinary){
	const {player} = this
	if(!player)return
	if(!isBinary)return void string(player, _buf.toString())
	const buf = new DataReader(_buf)
	const code = buf.byte()
	if(!codes[code])return
	try{
		codes[code](player, types[code] ? buf.read(types[code]) : buf)
	}catch(e){
		console.log(e)
	}
}
setTPS(TPS)
import { stats, util } from './internals.js'
import { WebSocketServer } from 'ws'
import { Dimensions, players } from './world/index.js'
import { chat, LIGHT_GREY, ITALIC } from './misc/chat.js'
import { commands, err } from './misc/commands.js'
import './utils/prototypes.js'
import { Entities, EntityIDs } from './entities/entity.js'
import { input, repl } from 'basic-repl'
import { codes, string } from './misc/incomingPacket.js'
import { CONFIG, HANDLERS, PERMISSIONS, TPS } from './config.js'
import { ItemIDs } from './items/item.js'
import { BlockIDs } from './blocks/block.js'
import { DataReader, DataWriter } from './utils/data.js'
import { setTPS } from './world/tick.js'
import { playerLeft, playerLeftQueue, queue } from './misc/queue.js'

let total = 5, loaded = -1, promise = null
let started = Math.round(Date.now() - performance.now())
globalThis.progress = function(desc){
	loaded++
	console.log(`\x1b[1A\x1b[9999D\x1b[2K\x1b[32m[${'#'.repeat(loaded)+' '.repeat(total-loaded)}] (${formatTime(Date.now()-started)}) ${desc}`)
	if(total == loaded + 1)promise()
}
process.stdout.write('\x1bc\x1b[3J')
progress('Modules loaded')
import('./entities/index.js').then(()=>progress(`${EntityIDs.length} Entities loaded`))
import('./items/index.js').then(()=>progress(`${ItemIDs.length} Items loaded`))
import('./blocks/index.js').then(()=>progress(`${BlockIDs.length} Blocks loaded`))
function uncaughtErr(e){
	const l = process.stdout.columns
	console.log('\n\x1b[31m'+'='.repeat(Math.max(0,Math.floor(l / 2 - 8)))+' Critical Error '+'='.repeat(Math.max(0,Math.ceil(l / 2 - 8)))+'\x1b[m\n\n' + (e && (e.stack || e.message || e)) + '\n\x1b[31m'+'='.repeat(l)+'\n' + ' '.repeat(Math.max(0,Math.floor(l / 2 - 28))) + 'Join our discord for help: https://discord.gg/NUUwFNUHkf')
	//process.exit(0)
}
process.on('uncaughtException', uncaughtErr)
process.on('unhandledRejection', uncaughtErr)
const clear = () => process.stdout.write('\x1bc\x1b[3J')
await new Promise(r=>promise=r)

export const server = new WebSocketServer({port: CONFIG.port || 27277, perMessageDeflate: false})
server.on('listening', () => {
	progress(`Everything Loaded. \x1b[1;33mServer listening on port ${server.address().port}\x1b[m\nPress Tab to switch between Chat and Repl`)
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
				if(res)console.log(res)
			}catch(e){ console.log('\x1b[31m'+err(e)+'\x1b[m'); return}
		}else{
			process.stdout.write('\x1b[A')
			input(false)
			chat('[server] ' + text, LIGHT_GREY + ITALIC)
		}
	})
})
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
	if(players.size + playersConnecting.size >= CONFIG.maxplayers){
		sock.on('close', playerLeftQueue)
		if(await queue(sock))return sock.close()
		sock.removeListener('close', playerLeftQueue)
	}
	let permissions = PERMISSIONS[username] || PERMISSIONS.default
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
		other.sock = null
		other.remove()
		player = other
	}else if(playersConnecting.has(username)){
		sock.send('-119You are still logging in/out from another session')
		sock.close()
		return
	}else try{
		playersConnecting.add(username)
		const buf = await HANDLERS.LOADFILE('players/'+username).reader()
		playersConnecting.delete(username)
		if(sock.readyState !== sock.OPEN)return
		player = Entities.player(buf.double(), buf.double(), Dimensions[buf.string()])
		buf.setUint32(buf.i, player._id)
		player.dx = buf.float(); player.dy = buf.float(); player.f = buf.float()
		buf.read(Entities.player._.savedata, player)
	}catch(e){
		player = Entities.player(0, 0, Dimensions.overworld)
		player.inv = [], player.health = 20
		let i = 41; while(i--)player.inv.push(null)
	}
	player.sock = sock
	player.ebuf = new DataWriter()
	player.ebuf.byte(20)
	player.name = username
	player.permissions = permissions
	sock.packets = []
	let buf = new DataWriter()
	buf.byte(1)
	buf.int(player._id | 0)
	buf.short(player._id / 4294967296 | 0)
	buf.byte(player.r = 0)
	buf.string(player.world.id)
	buf.pipe(sock)
	player.init()
	player.place()
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
	buf.double(player.x)
	buf.double(player.y)
	buf.string(player.world.id)
	buf.float(player.dx)
	buf.float(player.dy)
	buf.float(player.f)
	buf.write(Entities.player._.savedata, player)
	await HANDLERS.SAVEFILE('players/' + player.name, buf.build())
	playersConnecting.delete(player.name)
	playerLeft()
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
		codes[code](player, buf)
	}catch(e){console.warn(e)}
}
setTPS(TPS)
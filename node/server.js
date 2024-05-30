import { argv } from './internals.js'
import fs from 'fs/promises'
import { DataReader, DataWriter, decoder, encoder } from '../modules/dataproto.js'
import crypto from 'node:crypto'
import { deflateSync } from 'node:zlib'
import { TLSSocket } from 'node:tls'
import util from 'node:util'
import { contentType } from 'mime-types'
import { input, repl } from 'basic-repl'
import { App, SSLApp, us_listen_socket_close } from 'uWebSockets.js'
import { entityindex } from '../entities/index.js'
import { itemindex } from '../items/index.js'
import { blockindex } from '../blocks/index.js'
import { index } from '../misc/miscdefs.js'
import { open, close } from '../misc/sock.js'
import { players, STATS, DEFAULT_TPS, stat, saveAll, saving } from '../world/index.js'
import { codes, onstring } from '../misc/incomingPacket.js'
import { PROTOCOL_VERSION } from '../version.js'
import { Dimensions } from '../world/index.js'
import { entityMap, setTPS } from '../world/tick.js'
import { chat, LIGHT_GREY, ITALIC, printChat } from '../misc/chat.js'
import { commands, err, executeCommand } from '../misc/_commands.js'
import { BlockIDs, Blocks } from '../blocks/block.js'
import { ItemIDs, Items } from '../items/item.js'
import { Entities, EntityIDs } from '../entities/entity.js'
import { Chunk } from '../world/chunk.js'

const PUBLICKEY = `-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEA1umjA6HC1ZqCFRSVK1Pd3iSVl82m3UYvSOeZOJgL/yaYnWx47hvo
sXS9GkNjgfl3WATBJ33Q/cigpAi9svLoQgcgkIH+UlMTIJhvuuZ1JK7L6zLwPfyY
s4slcfqVjjC3KsD4Neu2kI9DAw696yiDlSrGFlgVG2GHYjOx1N60CALkKm4oJh1w
dAcg25lE9hao850GIDYqD44BkmbP6KAN1YN0lfyHRwCxmrkNPoFrg5dN1UkwEmnC
gnhKtGgJDdv3MweRrgkyz0aethcpcCF17xlXwszJn/Nyvc+E7+8XIRSbFglij0ei
KOp/re6t/rgyqmjdxEWoXXptl9pjeVnJbwIDAQAB
-----END RSA PUBLIC KEY-----`

const genInfo = () => {
	const ps = [], playerData = CONFIG.showhealth ? [] : undefined
	for(const p of players.values()) ps.push(p.name), playerData?.push(p.health)
	return {players: ps, playerData, magic_word: CONFIG.magic_word, name: CONFIG.name, icon: CONFIG.icon, banner: CONFIG.banner, motd: CONFIG.motd[floor(random() * CONFIG.motd.length)], stats: STATS}
}

const endpoints = {
	async avatar(res, i){
		const p = players.get(i.split('?',1)[0])
		if(!p) return void res.end('Player offline')
		res.writeHeader('content-type', 'image/png')
		const a = await p.getAvatar()
		if(res.aborted) return
		res.cork(()=>res.end(a))
	},
	play(res){
		res.writeStatus('301')
		res.writeHeader('Location', 'https://openmc.pages.dev/?' + wsHost)
		res.end('')
	},
	static(res, url=''){
		const mt = contentType(url)
		url = PATH+'node/static/'+decodeURI(url).replace(/^\/+|\/+$/g,'')
		let sentMimetype = false
		fs.createReadStream(url).on('error', () => {
			fs.createReadStream(url+'/index.html').on('error', () => {
				res.aborted || res.cork(()=>{
					res.writeStatus('404')
					res.writeHeader('content-type', 'text/plain')
					res.end('404')
				})
			}).on('data', a => res.aborted || res.cork(()=>{
				if(!sentMimetype) sentMimetype=true,res.writeHeader('content-type', 'text/html')
				res.write(a)
			})).on('end', () => res.aborted || res.cork(()=>res.end()))
		}).on('data', a => res.aborted || res.cork(()=>{
			if(!sentMimetype) sentMimetype=true,res.writeHeader('content-type', mt)
			res.write(a)
		})).on('end', () => res.aborted || res.cork(()=>res.end()))
	},
	'info.json'(res){
		res.writeHeader('content-type', 'application/json')
		res.end(JSON.stringify(genInfo()))
	}
}
Object.setPrototypeOf(endpoints, null)
const {0:statsHtml0, 1:statsHtml1} = (await fs.readFile(PATH+'node/index.html')).toString().split('[[SERVER_INSERT]]')
const PORT = argv.port || CONFIG.port || 27277
let wsHost = ''
const {key, cert} = CONFIG
const secure = !(key==null || cert==null)
const certPath = secure ? cert ? cert[0]=='/'||cert[0]=='~' ? cert : PATH + '../' + cert : PATH+'node/default.crt':null
const server = secure ? SSLApp({
	key_file_name: key ? key[0]=='/'||key[0]=='~' ? key : PATH + '../' + key : PATH+'node/default.key',
	cert_file_name: certPath,
}) : App()

if(secure && cert){
	const sock = new TLSSocket(null, {cert: await fs.readFile(certPath)})
	const {subject: {CN}, valid_to} = sock.getCertificate()
	const expires = +new Date(valid_to)
	if(expires < Date.now()) console.warn('SSL certificate has expired')
	host = CONFIG.host ?? CN.split(',').find(a=>!a.includes('*'))
	if(!host) throw "Unable to determine host name, which is required for secure servers. Specify one via -host=<host> as a command line argument, or add a property 'host' in properties.yaml\n"
	host += ':' + PORT
	wsHost = 'wss://' + host; httpHost = 'https://' + host
	sock.destroy()
}else if(secure){
	wsHost = host = 'localhost:' + PORT
	httpHost = 'https://' + host
} // Else it's inferred from the first connection to the server (not safe, but then neither is http)

server.any('/*', (res, req) => {
	res.onAborted(() => res.aborted = true)
	if(!wsHost){
		// Insecure / development only
		host = req.getHeader('host')
		wsHost = 'ws://' + host
		httpHost = 'http://' + host
	}
	const {1:endpoint,2:i} = req.getUrl().match(/\/([\.\w_\-]+)(?:\/(.*))?$|/y)
	if(!endpoint){
		res.write(statsHtml0)
		res.write(JSON.stringify(genInfo()))
		res.write(statsHtml1)
		res.end()
		return
	}
	try{
		if(endpoint in endpoints) return endpoints[endpoint](res, i, req)
	}catch(e){
		if(CONFIG.log)
			console.warn(e)
	}
	return res.writeStatus('404'), res.end('404')
})

const indexCompressed = (b => new Uint8Array(b.buffer, b.byteOffset, b.byteLength))(deflateSync(Buffer.from(blockindex + '\0' + itemindex + '\0' + entityindex + '\0' + index + (CONFIG.components||['/vanilla/index.js']).map(a=>'\0'+a).join(''))))
const clients = new Set
const rand = new Uint8Array(32)
let patchWs = function(sock){patchWs = null; const p = Object.getPrototypeOf(sock); p._send = p.send; p.send = function(a){if(this.state) this._send(a,typeof a!='string')}}
server.ws('/*', {
	sendPingsAutomatically: false, maxBackpressure: (CONFIG.socket.backpressure)*1048576,
	maxPayloadLength: 1048576, closeOnBackpressureLimit: true,
	upgrade(res, req, ctx){
		const h = req.getHeader('host')
		if(!wsHost){
			// Insecure / development only
			wsHost = 'ws://' + h
			httpHost = 'http://' + h
			host = h
		}
		if(exiting) return void res.end(undefined, true)
		const {1:username,2:pubKey,3:authSig} = req.getUrl().split('/').map(decodeURIComponent)
		if(!crypto.verify('SHA256', Buffer.from(username + '\n' + pubKey), PUBLICKEY, Buffer.from(authSig||'', 'base64'))){
			res.end(undefined, true)
			if(argv.log) throw 'Invalid public key signature'
			return
		}
		crypto.getRandomValues(rand)
		res.upgrade({
			username, skin: null, pubKey, pingTime: 0, lastPing: 0,
			challenge: Buffer.concat([encoder.encode(h+'\0'), rand]),
			entity: null,
		},
			req.getHeader('sec-websocket-key'),
			req.getHeader('sec-websocket-protocol'),
			req.getHeader('sec-websocket-extensions'),
			ctx
		)
	},
	open(sock){
		patchWs?.(sock)
		sock.state = 1
		clients.add(sock)
		const data = sock.getUserData()
		const buf = new DataWriter()
		buf.string(CONFIG.name || '')
		buf.string(CONFIG.motd[floor(random() * CONFIG.motd.length)] || '')
		buf.string(CONFIG.icon || '')
		buf.string(CONFIG.banner || '')
		buf.uint8array(indexCompressed)
		buf.uint8array(data.challenge)
		sock.send(buf.build())
	},
	pong(sock){
		sock.pingTime = Date.now() - sock.lastPing
		sock.lastPing = 0
	},
	message(sock, a, isBinary){
		if(exiting) return
		const buf = new DataReader(a)
		try{
			if(sock.challenge){
				if(buf.byteLength <= 1010 || !isBinary) return
				const challenge = sock.challenge; sock.challenge = null
				const cli_ver = buf.short(), skin = new Uint8Array(a.slice(2, 1010))
				if(crypto.verify('SHA256', challenge, '-----BEGIN RSA PUBLIC KEY-----\n' + sock.pubKey + '\n-----END RSA PUBLIC KEY-----', new Uint8Array(a, 1010, a.byteLength - 1010))){
					if(cli_ver < PROTOCOL_VERSION)
						return void sock.end(1000, '\\2fOutdated client! Please update your client.\n(Client v'+cli_ver+' < Server v'+PROTOCOL_VERSION+')')
					else if(cli_ver > PROTOCOL_VERSION)
						return void sock.end(1000, '\\2fOutdated server! Contact server owner.\n(Client v'+cli_ver+' > Server v'+PROTOCOL_VERSION+')')
					sock.skin = skin
					open.call(sock)
				}else{
					sock.end(1000, '\\19Invalid signature')
					throw 'Invalid signature'
				}
				return
			}
			if(!isBinary) return void onstring.call(sock, sock.entity, decoder.decode(a))
			const code = buf.byte()
			if(!codes[code]) return
			codes[code].call(sock, sock.entity, buf)
		}catch(e){ if(argv.log) throw decoder.decode(sock.getRemoteAddressAsText()) + ' made a malicious packet: ' + (e?.stack??e?.message??e) }
	},
	close(sock){ const os = sock.state; sock.state = 0; if(clients.delete(sock)) close.call(sock, os) }
})
setInterval(() => {
	for(const u of clients){
		if(u.lastPing % 1){ u.end(); continue }
		if(u.lastPing){ u.lastPing += 0.5 }
		u.lastPing = Date.now()
		u.ping()
	}
}, 10e3)

let listenSocket = null
process.on('SIGINT', code => {
	if(typeof code != 'number') code = undefined
	//Save stuff here
	if(exiting) return console.log('\x1b[33mTo force shut down the server, evaluate \x1b[30mprocess.exit(0)\x1b[33m in the repl\x1b[m')
	console.log('\x1b[33mShutting down gracefully...\x1b[m')
	if(listenSocket) us_listen_socket_close(listenSocket)
	exiting = true
	saving.then(() => {
		const pr = []
		for(const sock of clients){
			if(code && !argv.manual){
				const d = min(round((sock.pingTime + 1500 + started-performance.timeOrigin)/10),999)
				sock.end(3000+d, '\\0fReconnecting shortly...')
			}
			pr.push(close.call(sock))
		}
		clients.clear()
		pr.push(saveAll())
		Promise.all(pr).then(() => DB.close(() => process.exit(code)))
	})
})
void function timeout(){if(exiting) return; setTimeout(() => saveAll().then(timeout), 300e3)}()
const clear = () => process.stdout.write('\x1bc\x1b[3J')
const serverObject = {
	sock: {perms: 4},
	x: 0, y: 0, getName(){return ''},
	world: Dimensions.overworld
}
export default function openServer(){
	const serverLoaded = task('Starting server...')
	server.listen(PORT, lS => {
		lS = listenSocket
		if(exiting){ us_listen_socket_close(lS); return }
		started = Date.now()
		clear()
		serverLoaded(`Everything Loaded. \x1b[1;33mServer listening on port ${PORT+(secure?' (secure)':'')}\x1b[m\nType /help for a list of commands, or hit tab to switch to JS repl`)
		setTPS(DEFAULT_TPS)
		stat('misc', 'restarts')
		repl('[server] ', async text => {
			if(text == 'clear') return clear()
			if(text[0] == '/'){
				try{
					const match = text.slice(1).match(/"(?:[^\\"]|\\.)*"|[^"\s]\S*|"/g) || ['help']
					for(let i = 0; i < match.length; i++){
						const a = match[i]
						try{match[i] = a[0]=='"'?JSON.parse(a):a}catch(e){throw 'Failed parsing argument '+i}
					}
					if(!(match[0] in commands)) throw 'No such command: /'+match[0]
					stat('misc', 'commands_used')
					const res = await executeCommand(match[0], match.slice(1), serverObject, 4)
					if(res)printChat(res)
				}catch(e){ printChat(err(e)); return}
			}else{
				process.stdout.write('\x1b[A')
				input(false)
				chat('\\27[server] ' + text)
			}
		})
		repl('$ ', async _ => _ == 'clear' ? clear() : console.log(util.inspect(await eval(_),false,5,true)))
	})
}
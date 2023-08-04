import { Dimensions, players } from './world/index.js'
import './utils/prototypes.js'
import { CONFIG, HANDLERS, STATS, DEFAULT_TPS, stat } from './config.js'
import { setTPS, entityMap } from './world/tick.js'
import { close, httpServer, secure, server } from './server/server.js'
import { argv, ready, stats } from './internals.js'
import util from 'node:util'
import { chat, LIGHT_GREY, ITALIC } from './misc/chat.js'
import { commands, err } from './misc/commands.js'
import { input, repl } from 'basic-repl'
import { Entities } from './entities/entity.js'
import { Blocks } from './blocks/block.js'
import { Items } from './items/item.js'
process.stdout.write('\x1bc\x1b[3J')

await ready
task.done('Modules loaded')
const clear = () => process.stdout.write('\x1bc\x1b[3J')
const serverLoaded = task('Starting server...')
httpServer.once('listening', () => {
	serverLoaded(`Everything Loaded. \x1b[1;33mServer listening on port ${server.address().port+(secure?' (secure)':'')}\x1b[m\nType /help for a list of commands, or hit tab to switch to JS repl`)
	stat('misc', 'restarts')
	repl('[server] ', async text => {
		if(text == 'clear') return clear()
		if(text[0] == '/'){
			try{
				const match = text.slice(1).match(/"(?:[^\\"]|\\.)*"|[^"\s]\S*|"/g)
				if(!match) return void console.log('Slash, yes, very enlightening.')
				for(let i = 0; i < match.length; i++){
					const a = match[i]
					try{match[i] = a[0]=='"'?JSON.parse(a):a}catch(e){throw 'Failed parsing argument '+i}
				}
				if(!(match[0] in commands))throw 'No such command: /'+match[0]
				stat('misc', 'commands_used')
				let res = await commands[match[0]].apply(server, match.slice(1))
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

httpServer.listen(argv.port || CONFIG.port || 27277)
setTPS(DEFAULT_TPS)

globalThis.exiting = false
let promises = []
process.on('SIGINT', _ => {
	//Save stuff here
	if(exiting) return console.log('\x1b[33mTo force shut down the server, evaluate \x1b[30mprocess.exit(0)\x1b[33m in the repl\x1b[m')
	console.log('\x1b[33mShutting down gracefully...\x1b[m')
	server.close()
	exiting = true
	Promise.all(promises).then(() => {
		promises.length = 0
		for(const sock of server.clients) promises.push(close.call(sock))
		saveAll(() => process.exit(0))
	})
})
function saveAll(cb){
	for(const name in Dimensions){
		const d = Dimensions[name]
		const buf = new DataWriter()
		buf.flint(d.constructor.savedatahistory.length)
		buf.write(d.constructor.savedata, d)
		promises.push(HANDLERS.SAVEFILE('dimensions/'+name+'/meta', buf.build()))
		for (const ch of d.values()) d.save(ch)
	}
	promises.push(HANDLERS.SAVEFILE('stats.json', JSON.stringify(STATS)))
	Promise.all(promises).then(cb)
}
void function timeout(){if(exiting) return; promises.length = 0; setTimeout(saveAll, 300e3, timeout)}()
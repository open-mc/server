import './config.js'
import { ready } from './internals.js'
const { PORT, server, openServer } = await import('./server.js')
await ready
task.done('Modules loaded')
if(CONFIG.manual){
	console.log('\x1b[mPress enter to start server')
	const _ = (''+await new Promise(r => process.stdin.once('data', r))).slice(0,-1)
}
openServer()
import { players, MOD, OP, PERMISSIONS, savePermissions, NORMAL } from '../world/index.js'
import { Dimensions, GAMERULES, stat } from '../world/index.js'
import { chat } from './chat.js'
import { DXDY, Entities, EntityIDs } from '../entities/entity.js'
import { ItemIDs, Items } from '../items/item.js'
import { goto, jump, peek, place, right, up } from './ant.js'
import { BlockFlags, BlockIDs, Blocks } from '../blocks/block.js'
import { currentTPS, setTPS, setTickFlags, tickFlags } from '../world/tick.js'
import { generator } from '../world/gendelegator.js'
import { Chunk } from '../world/chunk.js'
import { X, Y } from '../entities/entity.js'
import { damageTypes } from '../entities/deathmessages.js'
import { playersConnecting, playersLevel } from './sock.js'
import { executeCommand, PERMS, commands, stack, selector, serializeTypePretty, log, parseCoords, snbt, marks, ITEMCOMMONDATA, ENTITYCOMMONDATA, publicCommands, modCommands } from './_commands.js'
import { VERSION } from '../version.js'

Object.assign(commands, {
	list(){
		let a = "Online players"
		for(let pl of players.values()) a += '\n' + pl.name + ' ('+pl.health+')'
		return a
	},
	say(...s){ chat(s.join(' ')) },
	bell(){
		globalThis.process?.stdout.write('\x07')
		for(const p of players.values()) p.sock?.send('')
	},
	tpe(a='@s', b){
		if(!b) b = a, a = '@s'
		const targets = selector(a, this)
		const [target, _] = selector(b, this)
		if(_ || !target) throw 'Selector must return exactly 1 target'
		const {x, y, world} = target
		for(const e of targets)
			e.x = x, e.y = y, e.world = world, e.sock && e.rubber(X | Y)
		if(targets.length>1) return log(this, `Teleported ${targets.length} entities to ${target.name}`)
		else return log(this, `Teleported ${targets[0].name} to ${target.name}`)
	},
	tp(a='@s', _x, _y, d = '~'){
		if(!_x) throw 'Missing coordinates'
		if(!_y) _y=_x,_x=a=='@s'?'~':a,a='@s'
		const targets = selector(a, this)
		const {x, y, w} = parseCoords(_x, _y, d, this)
		for(const e of targets)
			e.x = x, e.y = y, e.world = w, e.dx = e.dy = 0, e.sock && e.rubber(X | Y | DXDY)
		if(targets.length>1) return log(this, `Teleported ${targets.length} entities to (x=${x.toFixed(3)}, y=${y.toFixed(3)}) in the ${w.id}`)
		else return log(this, `Teleported ${targets[0].name} to (x=${x.toFixed(3)}, y=${y.toFixed(3)}) in the ${w.id}`)
	},
	kick(a, ...r){
		const reason = r.join(' ')
		const targets = selector(a, this)
		if(targets.length > 1 && this?.sock?.perms < OP) throw 'Moderators may not kick more than 1 person at a time'
		stat('misc', 'player_kicks', targets.length)
		let kicked = 0
		for(const pl of targets){
			if(!pl.sock) continue
			pl.sock.end(1000, reason ? '\\2fYou were kicked for: \n'+reason : '\\2fYou were kicked')
			kicked++
		}
		return log(this, `Kicked ${kicked} player(s)`)
	},
	reconn(a='@s', t=0){
		t = max(0, min(999, t*100 || 0))
		const targets = selector(a, this)
		let count = 0
		for(const pl of targets){
			if(!pl.sock) continue
			pl.sock.end(3000+t, 'Reconnecting shortly...')
			count++
		}
		return log(this, `Reconnnecting ${count} player(s)`)
	},
	give(sel, item = '', amount = '1', dat = ''){
		let itm = Items[item], c = max(amount | 0, 1)
		if(!itm) throw 'No such item: '+item
		let count = ''
		for(const player of selector(sel, this)){
			if(!count && player.sock) count = player.name
			else if(typeof count == 'string') count = 2-!count
			else count++
			const stack = new itm(c)
			if(dat) snbt(dat, stack, stack.savedata, ITEMCOMMONDATA)
			player.giveAndDrop(stack)
		}
		return log(this, 'Gave '+(typeof count=='number'?count+' players':count)+' '+item+'*'+c)
	},
	summon(type, _x = '~', _y = '~', _d = '~', data = ''){
		const {x, y, w} = parseCoords(_x, _y, _d, this)
		if(!(type in Entities)) throw 'No such entity: ' + type
		const e = new Entities[type]()
		snbt(data, e, e.savedata, ENTITYCOMMONDATA)
		e.place(w, x, y)
		return log(this, 'Summoned a(n) '+type+' with an ID of '+e.netId)
	},
	mutate(sel, data){
		let i = 0
		for(const e of selector(sel, this)){
			i++
			snbt(data, e, e.savedata, ENTITYCOMMONDATA)
			if(e.rubber) e.rubber()
		}
		return log(this, 'Successfully mutated '+i+' entities')
	},
	setblock(_x = '~', _y = '~', type = '', _d = '~', data = ''){
		const {x, y, w} = parseCoords(_x, _y, _d, this)
		let b
		let id = type & 65535
		if(type && type == id){
			type = id
			if(type >= BlockIDs.length) throw 'No such block ID: ' + type
			b = BlockIDs[type]
		}else{
			if(!(type in Blocks)) throw 'No such block: ' + type
			b = Blocks[type]
		}
		if(b.adminOnly && this?.sock?.perms < OP) throw 'You do not have permission to place '+b.className
		if(b.savedata && data) snbt(data, b = new b, b.savedata)
		goto(w, floor(x), floor(y))
		place(b)
		return log(this, 'Set block at (x='+(floor(x)|0)+', y='+(floor(y)|0)+') to '+type+(data?' (+data)':''))
	},
	fill(_x, _y, _x2, _y2, type, d = '~'){
		let n = performance.now()
		let {x, y, w} = parseCoords(_x, _y, d, this)
		let {x: x2, y: y2} = parseCoords(_x2, _y2, d, this)
		x2=floor(x2-(x=floor(x)|0))|0;y2=floor(y2-(y=floor(y)|0))|0
		if(x2 < 0) x=x+x2|0, x2=abs(x2)|0
		if(y2 < 0) y=y+y2|0, y2=abs(y2)|0
		goto(w, x, y)
		let b
		if(type == (type & 65535)){
			type = type & 65535
			if(type >= BlockIDs.length) throw 'No such block ID: ' + type
			b = BlockIDs[type]
		}else{
			if(!(type in Blocks)) throw 'No such block: ' + type
			b = Blocks[type]
		}
		if(b.adminOnly && this?.sock?.perms < OP) throw 'You do not have permission to place '+b.className
		let count = x2*y2+x2+y2+1
		if(count > CONFIG.permissions.max_fill) throw 'Cannot /fill more than '+CONFIG.permissions.max_fill+' blocks'
		for(y = 0; y != y2+1; y=(y+1)|0){
			for(x = 0; x != x2+1; x=(x+1)|0){
				if(peek()==b) count--
				place(b)
				right()
			}
			jump(-x2-1,1)
		}
		n = performance.now() - n
		return log(this, 'Filled '+count+' blocks with ' + type + (count > 10000 ? ' in '+n.toFixed(1)+' ms' : ''))
	},
	id(cat, type){
		cat = cat.toLowerCase()
		let dict, list, name
		switch(cat){
			case 'block': dict = Blocks, list = BlockIDs, name = 'Block'; break
			case 'item': dict = Items, list = ItemIDs, name = 'Item'; break
			case 'entity': dict = Entities, list = EntityIDs, name = 'Entity'; break
			default: throw 'Allowed categories: block, item, entity'
		}
		let res, obj
		if(type == (type & 65535)){
			type = type & 65535
			if(type >= list.length) throw 'No such '+name.toLowerCase()+' ID: ' + type
			res = name+' ID '+type+' is '+(obj=list[type]).className
		}else{
			if(!(type in dict)) throw 'No such '+name.toLowerCase()+': ' + type
			res = name+' '+type+' has ID '+(obj=dict[type]).id
		}
		if(obj.savedata){
			res += ' and has data attributes:\n' + serializeTypePretty(obj.savedata)
		}else res += ' and has no data attributes'
		return res
	},
	clear(sel = '@s', _item='none', _max = '2147483647'){
		const Con = _item!='none' ? Items[_item] : null
		if(Con === undefined) throw 'No such item: '+_item
		let cleared = 0, count = ''
		_max = +_max
		for(const e of selector(sel, this)){
			if(!count && e.sock) count = e.name
			else if(typeof count == 'string') count = 2-!count
			else count++
			let max = _max
			a: for(const id of e.allInterfaces??[]){
				e.mapItems(id, item => {
					if(!max) return
					if(!item || (Con && item.constructor != Con)) return
					max -= item.count
					item.count = -min(0, max)
					return item.count > 0 ? item : null
				})
			}
			cleared += _max - max
		}
		return log(this, `Cleared a total of ${cleared} items from ${typeof count=='number'?count+' entities':count}`)
	},
	help(c){
		const perm = !this ? OP : this.sock ? this.sock.perms : 0
		const cmds = perm == MOD ? mod_help : perm == OP ? help : anyone_help
		if(!c){
			return 'Commands: /'+Object.keys(cmds).join(', /')+'\n/help '+cmds.help
		}else if(c in cmds){
			return Array.isArray(cmds[c]) ? cmds[c].map(a => '/' + c + ' ' + a).join('\n') : '/' + c + ' ' + cmds[c]
		}else{
			return 'No such command: /'+c
		}
	},
	stacktrace(){
		if(!stack) return 'No stack trace found...'
		console.warn(stack)
		return stack
	},
	time(time='', d = this?this.world:'overworld'){
		if(typeof d == 'string') d = Dimensions[d]
		if(!d) throw 'Invalid dimension'
		if(time == 'get' || !time){
			return `This dimension is on tick ${d.tick}\nThe day is ${floor((d.tick + 7000) / 24000)} and the time is ${floor((d.tick/1000+6)%24).toString().padStart(2,'0')}:${(floor((d.tick/250)%4)*15).toString().padStart(2,'0')}`
		}else if(time[0] == '+' || time[0] == '-'){
			let t = d.tick + +time
			if(t < 0) t = (t % 24000 + 24000) % 24000
			if(t != t) throw `'${time}' is not a valid number`
			d.tick = t
		}else if(time[0] >= '0' && time[0] <= '9'){
			const t = +time
			if(!(t >= 0)) throw `'${time}' is not a valid number`
			d.tick = t
		}else{
			let t;
			switch(time){
				case 'day': t = 1800; break
				case 'noon': t = 6000; break
				case 'afternoon': t = 9000; break
				case 'sunset': t = 13800; break
				case 'night': t = 15600; break
				case 'midnight': t = 18000; break
				case 'dark': t = 22000; break
				case 'sunrise': t = 0; break
				default:
				throw "'invalid option: '"+time+"'"
			}
			t = (d.tick - t) % 24000
			if(t >= 12000) d.tick += (24000 - t)
			else d.tick -= t
		}
		return log(this, 'Set the '+d.id+' time to '+d.tick)
	},
	weather(type, duration, world = this?this.world:'overworld'){
		if(typeof world == 'string') world = Dimensions[world]
		if(!world || world != Dimensions.overworld) throw 'This command is not available for this dimension'
		if(!type){
			const {weather} = world
			return 'The current weather is '+(!weather?'clear':
				weather > 0x20000000 ? 'downpour for '+round((weather-0x20000000)/currentTPS)+'s'
				: weather > 0x10000000 ? 'thunder for '+round((weather-0x10000000)/currentTPS)+'s'
				: 'rain for '+round(weather/currentTPS)+'s'
			)
		}
		duration = min(0x0FFFFFFF, duration || (600 + floor(random() * 600))*currentTPS)
		if(type == 'clear') world.weather = 0
		else if(type == 'rain') world.weather = duration
		else if(type == 'thunder') world.weather = 0x10000000 + duration
		else if(type == 'downpour') world.weather = 0x20000000 + duration
		else throw 'Allowed weather types: clear, rain, thunder, downpour'
		world.event(10, buf => buf.uint32(world.weather))
		return log(this, 'Set the weather to '+type+(world.weather?' for '+round(duration/currentTPS)+'s':''))
	},
	gamerule(a, b){
		if(!a){
			return 'List of gamerules:\n' + Object.entries(GAMERULES).map(([k, v]) => k + ': ' + JSON.stringify(v)).join('\n')
		}
		a = a.toLowerCase()
		if(!b){
			if(!(a in GAMERULES)) throw 'No such gamerule: ' + a
			return 'Gamerule ' + a + ': ' + JSON.stringify(GAMERULES[a])
		}
		switch(typeof GAMERULES[a]){
			case 'boolean': if(b.toLowerCase() == 'true' || b == '1') GAMERULES[a] = true; else if(b.toLowerCase() == 'false' || b == '0') GAMERULES[a] = false; else throw 'Invalid boolean value: ' + b; break
			case 'number': const c = +b; if(c == c) GAMERULES[a] = c; else throw 'Invalid number value: ' + b; break
			case 'string': GAMERULES[a] = c; break
			default: throw 'No such gamerule: ' + a
		}
		return log(this, 'Set gamerule ' + a + ' to ' + JSON.stringify(GAMERULES[a]))
	},
	spawnpoint(x='~',y='~',d=this){
		if(x.toLowerCase() == 'tp') // For the /spawnpoint tp [entity] syntax
			return commands.tp.call(this, y == '~' ? '@s' : y, GAMERULES.spawnx, GAMERULES.spawny, GAMERULES.spawnworld)
		void ({x: GAMERULES.spawnx, y: GAMERULES.spawny, w: {id: GAMERULES.spawnworld}} = parseCoords(x,y,d,this))
		return log(this, `Set the spawn point to (x=${GAMERULES.spawnx.toFixed(2)}, y=${GAMERULES.spawny.toFixed(2)}) in the ${GAMERULES.spawnworld}`)
	},
	info(){
		return `Vanilla server software ${VERSION}\nUptime: ${Date.formatTime(Date.now() - started)}, CPU: ${(perf.elu[0]*100).toFixed(1)}%, RAM: ${(perf.mem[0]/1048576).toFixed(1)}MB` + (this.age ? '\nTime since last death: ' + Date.formatTime(this.age * 1000 / currentTPS) : '')
	},
	tick(tps=''){
		if(tps[0] == '+'){
			if((tickFlags&3)==3) throw 'All tick phases are already running. Use /tick freeze to disable them'
			setTickFlags(tickFlags, min(10*currentTPS, max(1, +tps.slice(1)||1)))
			return
		}
		const r = tpsRules[tps.toLowerCase()]
		if(r>=0) setTickFlags(r)
		const v = r >= 0 || !tps ? (tickFlags&2?tickFlags&1?'everything':'entities only':tickFlags&1?'blocks only':'nothing') : ''
		if(r>=0) return log(this, 'Set the server to tick '+v)
		if(!tps) return 'The TPS is '+currentTPS+' and the server is currently ticking '+v
		setTPS(max(1, min((tps|0) || 20, 1000)))
		for(const pl of players.values()){
			pl.sock.r--; pl.rubber(0)
		}
		return log(this, 'Set the TPS to '+currentTPS)
	},
	radius(r=-1){
		if(!this.sock.entity) throw 'Not a player'
		if(r < 0) return 'Loading radius is at r='+(this.radius-1)
		r = min(257, max(2, +r + 1 | 0))
		if(r == this.radius) return 'Loading radius unchanged (r='+(r-1)+')'
		const {chunkX, chunkY} = this
		this.unload(chunkX, chunkY, this.world)
		this.radius = r
		this.load(chunkX, chunkY, this.world)
		return 'Loading radius set to '+(r-1)
	},
	kill(t = '@s', cause = 'void'){
		if(this?.sock?.perms < MOD){
			if(!CONFIG.permissions.suicide) throw 'This server does not permit suicide'
			if(t != '@s' || cause != 'void') throw 'You do not have permission to use /kill that way'
		}
		const c = damageTypes[cause] || null
		let i = 0
		for(const e of selector(t, this)){
			if(!e.linked) continue
			if(e.damage) e.damage(e.health, c)
			else e.kill(c)
			i++
		}
		return log(this, 'Killed '+i+' entities')
	},
	where(t = ''){
		if(this?.sock?.perms < MOD) if(t) throw 'You do not have permission to use /where for other players'
		const f = selector(t, this)
		if(f.length>1){
			const histogram = new Map()
			let unlinked = 0
			for(const e of f){
				histogram.set(e.world, (histogram.get(e.world)||0)+1)
				if(!e.linked) unlinked++
			}
			if(histogram.size == 1){
				const w = histogram.keys().next().value
				return `Selector found ${f.length} entities in ${w?'the '+w.id:'limbo'}${unlinked?' (of which '+unlinked+' unlinked)':''}`
			}
			const r = [`Selector found ${f.length} entities${unlinked?' (of which '+unlinked+' unlinked)':''}:`]
			for(const {0: w, 1: c} of histogram) r.push(w ? `${c} in the ${w.id}` : `${c} in limbo`)
			return r.join('\n')
		}
		const {x,y,world,health,sock,linked} = f[0]
		const w = `(x=${x.toFixed(3)}, y=${y.toFixed(3)}) `+(world?'in the '+world.id:'outside of the space-time continuum')
		return !t&&sock ? `You are${linked?'':' unlinked'} at ${w} and have ${health/2||0} heart(s)` : `${f[0].name||f[0].className} is${linked?'':' unlinked'} at ${w} and has ${health/2||0} heart(s)`
	},
	hide(t = '@s'){
		let i = 0
		for(const e of selector(t, this)){
			if(!e.sock) continue
			e.unlink()
			i++
		}
		return log(this, 'Unlinked '+i+' players')
	},
	show(t = '@s'){
		let i = 0
		for(const e of selector(t, this)){
			if(!e.sock) continue
			e.link()
			if(e.health <= 0) e.damage(-Infinity, null)
			i++
		}
		return log(this, 'Linked '+i+' players')
	},
	async regen(_x, _y, _w){
		let {x, y, w} = parseCoords(_x, _y, _w, this)
		x = floor(x) >>> 6; y = floor(y) >>> 6
		const chunk = w.chunk(x, y)
		if(!chunk) throw 'Chunk not loaded'
		chunk.t = 2147483647
		const buf = new DataReader(await generator(x, y, w.id))
		chunk.parse(buf)
		const delw = new DataWriter()
		delw.byte(17), delw.int(x), delw.int(y)
		const del = delw.build()
		for(const sock of chunk.sockets)
			sock.send(del), sock.send(Chunk.diskBufToPacket(buf, x, y))
		if(this){
			goto(this)
			let moved = false
			while((floor(this.y)&63|!moved) && peek().flags&BlockFlags.HARD_TOP)
				this.y = floor(this.y) + 1, moved = true, up()
			if(moved) this.rubber(Y)
		}
		return log(this, `Regenerated chunk located at (x=${x<<6}, y=${y<<6}) in the ${w.id}`)
	},
	perm(u, a){
		if(!u || !a) throw 'Usage: /perm <player> <permission_level>'
		if(!Object.hasOwn(PERMS, a)) throw 'Invalid permission'
		a = PERMS[a]
		let count = ''
		if(u[0] != '@'){
			PERMISSIONS[u] = a
			count = u
			const f = players.get(u)
			if(f) f.sock.perms = a, f.rubber(0)
		}else for(const f of selector(u, this)){
			if(!f.sock | !f.name) continue
			if(count) count = typeof count == 'string' ? 2 : count+1
			else count = f.name
			PERMISSIONS[f.name] = a
			f.sock.perms = a, f.rubber(0)
		}
		savePermissions()
		return log(this, 'Set the permission of '+(typeof count=='number'?count+' players':count)+' to '+a)
	},
	ban(u, a = ''){
		if(!u) throw 'Specify user!'
		a = a.toLowerCase()
		if(a.endsWith('m')) a = a.slice(0, -1)*60
		else if(a.endsWith('h')) a = a.slice(0, -1)*3600
		else if(a.endsWith('d')) a = a.slice(0, -1)*86400
		else if(a.endsWith('w')) a = a.slice(0, -1)*604800
		else if(a.endsWith('mo')) a = a.slice(0, -2)*2592000
		else if(a.endsWith('s')) a = +a.slice(0, -1)
		else if(a.startsWith('in')) a = 1e100
		else a = +a
		a = round(Date.now()/1000+(a||604800))
		let count = ''
		if(u[0] != '@'){
			PERMISSIONS[u] = a
			count = u
			const f = players.get(u)
			if(f){
				f.sock.perms = a
				f.sock.end(1000, '\\19You have been banned from this server')
			}
			stat('misc', 'player_kicks', 1)
		}else for(const f of selector(u, this)){
			if(!f.sock | !f.name) continue
			if(count) count = typeof count == 'string' ? 2 : count+1
			else count = f.name
			PERMISSIONS[f.name] = a
			f.sock.end(1000, '\\19You have been banned from this server')
			stat('misc', 'player_kicks', 1)
		}
		savePermissions()
		return log(this, 'Banned '+(typeof count=='number'?count+' players':count)+(a>=1e100?' permanently':' until '+new Date(a*1000).toLocaleString()))
	},
	wipe(u, msg='Your playerdata has been wiped. Reconnecting...'){
		if(!u) throw 'Specify user!'
		let count = ''
		if(u[0] != '@'){
			const p = players.get(u)
			count = u
			if(p){
				p.sock.entity.remove()
				p.sock.entity = null
				players.delete(u)
				p.sock.end(3100, '\\1f'+msg)
			}
			playersConnecting.add(u)
			playersLevel.del(u).then(() => playersConnecting.delete(u))
		}else for(const p of selector(u, this)){
			if(!p.sock | !p.name) continue
			if(count) count = typeof count == 'string' ? 2 : count+1
			else count = p.name
			p.sock.entity.remove()
			p.sock.entity = null
			players.delete(p.name)
			p.sock.end(3100, '\\1f'+msg)
			playersConnecting.add(p.name)
			playersLevel.del(p.name).then(() => playersConnecting.delete(p.name))
		}
		return log(this, 'Wiped playerdata for '+(typeof count=='number'?count+' players':count))
	},
	unban(u){
		if(!u) throw 'Specify user!'
		PERMISSIONS[u] = 100 // Expired ban
		savePermissions()
		return log(this, 'Unbanned '+u)
	},
	async as(t, c, ...a){
		if(!c) throw 'No command specified! (Do not include the / in the command name)'
		let k = 0
		const end = []
		for(const e of selector(t, this))
			end.push(executeCommand(c, a, e, this?.sock?.perms??4)), k++
		const res = []
		for(const v of end){
			const r = await v
			if(r) res.push(r)
		}
		res.push('Executed '+k+' commands successfully')
		return res.join('\n')
	},
	ping(){ return this?.sock?'Pong! '+(this.sock.pingTime)+'ms':'Pong!' },
	async repeat(k, c='', ...a){
		if(!c) throw 'No command specified! (Do not include the / in the command name)'
		k = min(k>>>0, 1e6)
		for(let i = 0; i < k; i++)
			await executeCommand(c, a, this, this?.sock?.perms??4)
		return 'Executed '+k+' commands successfully'
	},
	async try(c='', ...a){
		if(!c) throw 'No command specified! (Do not include the / in the command name)'
		try{ return await executeCommand(c, a, this, this?.sock?.perms??4) }
		catch(e){ return 'Command did not succeed: \\+9'+e }
	},
	defer(c='', ...a){
		if(!c) throw 'No command specified! (Do not include the / in the command name)'
		setImmediate(() => executeCommand(c, a, this, this?.sock?.perms??4))
	},
	async fail(c='', ...a){
		if(!c) throw 'No command specified! (Do not include the / in the command name)'
		let r
		try{ r=await executeCommand(c, a, this, this?.sock?.perms??4) }
		catch(e){ return 'Command failed successfully: \\+9'+e }
		throw r?'Command succeeded: \\+f'+r:'Command succeeded'
	},
	delay(k, c='', ...a){
		if(!c) throw 'No command specified! (Do not include the / in the command name)'
		k = max(-1e6, min(k, 1e6))
		if(k != k) throw 'Invalid delay'
		if(k <= 0){
			setTimeout(() => executeCommand(c, a, this, this.sock?.perms??4), k*-1000)
			return 'Command scheduled'
		}else return new Promise(r => setTimeout(r, k*1000)).then(() => executeCommand(c, a, this, this.sock?.perms??4))
	},
	mark(e='@s',xo,yo){
		if(!yo){ if(xo) yo=xo,xo=e,e='@s'; else xo=yo='0' }
		const [ent, ex] = selector(e, this)
		if(ex) throw '/mark only accepts one entity'
		const m = {x: ifloat(ent.x + (+xo||0)), y: ifloat(ent.y + (+yo||0)), world: ent.world, entity: ent}
		marks.set(this, m)
		return `Mark set at (x=${m.x.toFixed(3)}, y=${m.y.toFixed(3)}) in the ${m.world.id}`
	},
	restart(delay = 0){
		if(!globalThis.process) throw '/restart is only available for multiplayer servers'
		delay *= 1000
		if(!(delay >= 0)) throw 'Invalid delay'
		setTimeout(process.emit.bind(process, 'SIGINT', 1), delay)
		if(delay) setTimeout(() => chat('\\33[SERVER] Server restarting in '+Date.formatTime(delay))), log(this, 'Initiated a server restart')
	},
	mode(a='1', sel='@s'){
		a &= 255
		if(a>1) throw 'Invalid game mode'
		let players = 0
		for(const p of selector(sel, this)){
			if(!p.sock) continue
			if(players === 0) players = p.name
			else if(typeof players == 'string') players = 2
			else players++
			p.sock.mode = a
			p.rubber(0)
		}
		if(players === 0) throw 'Selector found no players'
		return log(this, `Set the mode of ${typeof players == 'string'?players:players+' players'} to ${(a==1?'creative':'survival')}`)
	},
	chunk(f='', _x='~', _y='~', d='~', v=''){
		const {x, y, w} = parseCoords(_x, _y, d, this)
		const ch = w.get((floor(x)>>>6)+(floor(y)>>>6)*0x4000000)
		if(!(ch?.loadedAround&0x100)) throw 'Chunk not loaded'
		switch(f=f.toLowerCase()){
			case 'border':
			ch.setFlags(v = v=='1'?1:v=='0'?0:~ch.flags&1)
			return 'Set border flag to '+v
			case 'pin':
			return ch.world.pin(ch) ? 'Pinned chunk' : 'Chunk already pinned'
			case 'unpin':
			return ch.world.unpin(ch) ? 'Unpinned chunk' : 'Chunk already unpinned'
			default: throw 'Unknown chunk option: '+f
		}
	},
	camera(e, t, v){
		if(!v) v=t,t=e,e='@s'
		if(!t) return 'Not enough arguments!'
		const targets = selector(e, this)
		const b = new DataWriter()
		b.byte(21)
		const val = +v || 0
		switch(t = t.toLowerCase()){
			case 'rot':
			b.byte(16)
			b.float(val/180*PI)
			break
			case 'offx':
			b.byte(2)
			b.float(val)
			break
			case 'offy':
			b.byte(8)
			b.float(val)
			break
			case 'staticx':
			b.byte(1)
			b.double(val)
			break
			case 'staticy':
			b.byte(4)
			b.double(val)
			break
			case 'zoom':
			b.byte(32)
			b.float(val)
			break
			case 'reset':
			b.byte(58)
			b.double(0); b.double(0)
			break
			default: throw 'Unknown camera option: '+t
		}
		const p = b.build(); let tot = 0
		for(const t of targets) t.sock?.send(p), tot++
		return `Set camera ${t} for ${tot} player(s)`
	}
})

const tpsRules = {
	__proto__: null,
	all: 3, everything: 3, resume: 3,
	blocks: 1, block: 1, chunks: 1, chunk: 1,
	entities: 2, entity: 2, none: 0, nothing: 0, freeze: 0,
}

//Aliases
commands.stop = commands.restart
commands.i = commands.info
commands.op = function(u){return commands.perm.call(this,u,OP)}
commands.deop = function(u){return commands.perm.call(this,u,NORMAL)}
commands.unlink = commands.hide
commands.link = commands.show
commands.doxx = commands.where

export const anyone_help = {
	help: '[cmd] -- Help for a command',
	list: '-- List online players',
	info: '-- Info about the server and yourself',
	i: ' (alias for /info)',
	kill: '-- Suicide'
}, mod_help = {
	...anyone_help,
	give: '[player] [item] (count=1) -- Give item(s) to a player',
	kick: '[player] (...reason) -- Kick a player from the server',
	say: '[...msg] -- Send a message in chat',
	tp: '[targets] [x] [y] (dimension=~) -- teleport entities to a dimension',
	tpe: '[targets] [dest_entity] -- Teleport entities to another entity',
	time: [
		'+[amount] (dimension=~) -- Add to time',
		'-[amount] (dimension=~) -- Substract from time',
		'[value] (dimension=~) -- Set time',
		'day|noon|afternoon|sunset|night|midnight|dark|sunrise (dimension=~) -- Set the time to a preset',
		'-- Get current time',
		'get (dimension=~) -- Get current time for a dimension'
	],
	weather: [
		'[type] (duration=auto) (dimension=~) -- Set the weather',
		' -- Check what weather it is',
		'get (dimension=~) -- Check what weather it is for a dimension'
	],
	summon: '[entity_type] (x) (y) (dimension=~) (snbt) -- Summon an entity',
	setblock: '[x] [y] [block_type] (dimension=~) (snbt) -- Place a block somewhere',
	clear: '[player] (filter_item=none) (max_amount=Infinity) -- Remove items from a player',
	fill: '[x0] [y0] [x1] [y1] [block_type] (dimension=~) -- Fill an area with a certain block',
	regen: '(x=~) (y=~) (dimension=~) -- Re-generate this chunk with fresh terrain',
	kill: '[target] (cause=void) -- Kill a player or entity',
	mark: ['[target] (x_off=0) (y_off=0) -- Set a marker point. Refer to your marker point by replacing position/entity selectors with \'!\'', '(x_off=0) (y_off=0) -- Same but omits entity selector (defaults to @s)'],
	id: 'block|item|entity [name]|[id] -- Get technical information about a block/item/entity from its name or ID',
	hide: '[player] -- Put a player in spectator',
	show: '[player] -- Put a player out of spectator',
	link: '-- alias for /show', unlink: '-- alias for /hide',
	where: '[player] -- Where is a specific player?',
	doxx: ' -- alias for /where',
	reconn: '(player=@s) (delay) -- Reconnect players',
	radius: ['-- Check your chunk loading radius', '[r] -- Set your chunk loading radius'],
	mode: '0|1 (target=@s) -- Set player\'s game mode, 0 = survival, 1 = creative',
}, help = {
	...mod_help,
	mutate: '[entity] [snbt] -- Change properties of an entity',
	gamerule: ['[gamerule] [value] -- Change a gamerule', '-- List available gamerules'],
	tick: ['[tps] -- Set TPS', 'freeze|resume|entities|blocks|all|none -- Enable only certain tick phases', '+[amount] -- Step some ticks forward (for tick phases that are disabled)'],
	spawnpoint: ['(x=~) (y=~) (dimension=~) -- Set the spawn point', 'tp (who=@s) -- Teleport entities to spawn'],
	perm: '[target] [int]|deny|spectator|normal|mod|op|default -- Set the permission level of a player',
	ban: '[target] (seconds) -- Ban a player for a specified amount of time (or indefinitely)',
	unban: '[username] -- Unban a player, they will be able to rejoin with default perms',
	wipe: '[username] (...reason) - Wipe a player\'s playerdata',
	op: '[target] -- Alias for /perm [target] op',
	deop: '[target] -- Alias for /perm [target] normal',
	as: '[target] [...command] -- Execute a command as a target',
	try: '[...command] -- Try a command, but will succeed even if the command failed',
	fail: '[...command] -- Try a command, expecting it to fail. Returns success if command failed, and failure otherwise',
	defer: '[...command] -- Defer a command to run after other immediate tasks',
	camera: [
		'[target] rot [rot] -- Rotate a player\'s camera',
		'[target] offx|offy [value] -- Add an x/y offset to a player\s camera. Can also be used to reset static camera',
		'[target] staticx|staticy [pos] -- Set a player\'s camera to be pinned to a specific x/y position',
		'[target] zoom [offset] -- Add a zoom offset (1 -> 2x zoom, -1 -> 0.5x zoom) to a player\'s camera',
		'[target] reset -- Completely reset a player\'s camera'
	],
	chunk: [
		'border (x=~) (y=~) (dimension=~) (1|0) -- Toggle or set chunk border flag',
		'pin|unpin (x=~) (y=~) (dimension=~) -- Pin/unpin a chunk. Pinned chunks are always simulated even when there are no players around. Some aspects of simulation only occurs when all surrounding chunks are also pinned'
	],
	repeat: '[count] [...command] -- Execute a command multiple times',
	delay: '[time_seconds] [...command] -- Execute a command after a delay',
	restart: '(delay_seconds=0) -- Restart the server after delay',
	stop: '-- Alias for /restart',
	bell: '-- @here',
}, cheats = ['give', 'summon', 'setblock', 'fill', 'mutate', 'time']
Object.setPrototypeOf(anyone_help, null)
Object.setPrototypeOf(mod_help, null)
Object.setPrototypeOf(help, null)

publicCommands.push(...Object.keys(anyone_help))
modCommands.push(...Object.keys(mod_help))
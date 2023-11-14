import { players, MOD, OP, PERMISSIONS, savePermissions, NORMAL } from '../world/index.js'
import { Dimensions, GAMERULES, stat } from '../world/index.js'
import { chat, LIGHT_GREY, ITALIC, prefix, GOLD, BOLD } from './chat.js'
import { Entities, Entity, EntityIDs } from '../entities/entity.js'
import '../node/internals.js'
import { ItemIDs, Items } from '../items/item.js'
import { goto, jump, peek, place, right, up } from './ant.js'
import { BlockIDs, Blocks } from '../blocks/block.js'
import { currentTPS, setTPS, entityMap } from '../world/tick.js'
import { generator } from '../world/gendelegator.js'
import { Chunk } from '../world/chunk.js'
import { X, Y } from '../entities/entity.js'
import { damageTypes } from '../entities/deathmessages.js'


const ID = /[a-zA-Z0-9_]*/y, NUM = /[+-]?(\d+(\.\d*)?|\.\d+)([Ee][+-]?\d+)?/y, BOOL = /1|0|true|false|/yi, STRING = /(['"`])((?!\1|\\).|\\.)*\1/y
const ESCAPES = {n: '\n', b: '\b', t: '\t', v: '\v', r: '\r', f: '\f'}
function snbt(s, i, t, T1, T2){
	if(typeof t == 'object'){
		if(s[i] != '{') throw 'Expected dict literal'
		while(s[++i] == ' ');
		if(s[i] == '}') return
		while(true){
			ID.lastIndex = i
			const [k] = s.match(ID)
			if(!k.length) throw 'expected prop name in dict declaration'
			i = ID.lastIndex - 1
			while(s[++i] == ' ');
			if(s[i] != ':' && s[i] != '=') throw 'expected : or = after prop name in snbt'
			while(s[++i] == ' ');
			const T = T2[k] || T1[k]
			switch(T){
				case Int8: case Int16: case Int32: case Float32:
				case Uint8: case Uint16: case Uint32: case Float64:
				if((s[i] < '0' || s[i] > '9') && s[i] != '.' && s[i] != '-' && s[i] != '+') throw 'Expected number for key '+k
				NUM.lastIndex = i
				t[k] = T(+s.match(NUM)[0])
				i = NUM.lastIndex
				break
				case Boolean:
				BOOL.lastIndex = i
				switch(s.match(BOOL)[0][0]){
					case 't': case 'T': case '1':	t[k] = true; break
					case 'f': case 'F': case '0': t[k] = false; break
					default: throw 'Expected boolean for key '+k
				}
				i = BOOL.lastIndex
				case String:
				STRING.lastIndex = i
				const a = s.match(STRING)
				if(!a) throw 'Expected string for key '+k
				t[k] = a.slice(1,-1).replace(/\\(x[a-fA-F0-9]{2}|u[a-fA-F0-9]{4}|.)/g, v => v.length > 2 ? String.fromCharCode(parseInt(v.slice(2))) : ESCAPES[v[1]] || v[1])
				break
				case undefined: case null: throw 'Object does not have key '+k
				default: i = snbt(s, i, t[k])
			}
			i--
			while(s[++i] == ' ');
			if(i >= s.length || s[i] == '}') break
			else if(s[i] != ',' && s[i] != ';') throw 'expected , or ; after prop declaration in snbt'
			while(s[++i] == ' ');
		}
	}else if(Array.isArray(t)){
		if(s[i] != '[') throw 'Expected array literal'
		while(s[++i] == ' ');
		let [T, l = NaN] = T1 || T2
		if(s[i] == ']' && !l) return void(t.length=0);
		let j = -1
		while(true){
			if(++j == l) throw 'Too many elements in array literal'
			switch(T){
				case Int8: case Int16: case Int32: case Float32:
				case Uint8: case Uint16: case Uint32: case Float64:
				if((s[i] < '0' || s[i] > '9') && s[i] != '.' && s[i] != '-' && s[i] != '+') throw 'Expected number for key '+k
				NUM.lastIndex = i
				t[j] = T(+s.match(NUM)[0])
				i = NUM.lastIndex
				break
				case Boolean:
				BOOL.lastIndex = i
				switch(s.match(BOOL)[0][0]){
					case 't': case 'T': case '1':	t[j] = true; break
					case 'f': case 'F': case '0': t[j] = false; break
					default: throw 'Expected boolean for key '+k
				}
				i = BOOL.lastIndex
				case String:
				STRING.lastIndex = i
				const a = s.match(STRING)
				if(!a) throw 'Expected string for key '+k
				t[j] = a.slice(1,-1).replace(/\\(x[a-fA-F0-9]{2}|u[a-fA-F0-9]{4}|.)/g, v => v.length > 2 ? String.fromCharCode(parseInt(v.slice(2))) : ESCAPES[v[1]] || v[1])
				break
				case undefined: case null: throw 'Invalid array type (weird)'
				default: i = snbt(s, i, t[j])
			}
			if(j < l) throw 'Not enough elements in array literal'
			i--
			while(s[++i] == ' ');
			if(i >= s.length || s[i] == '}') break
			else if(s[i] != ',' && s[i] != ';') throw 'expected , or ; after prop declaration in snbt'
			while(s[++i] == ' ');
		}
	}
}

function parseCoords(x = '~', y = '~', d = '~', t){
	const m = marks.get(t)
	if(!m&&(x[0]=='!'||y[0]=='!'||d=='!')) throw 'No marker set'
	let w = d == '~' ? t.world || Dimensions.overworld : d == '!' ? m.world : Dimensions[d]
	if(!w) throw 'No such dimension'
	if(x[0] == "^" && y[0] == "^"){
		x = (+x.slice(1))/180*PI - t.f
		y = +y.slice(1);
		[x, y] = [t.x - sin(x) * y, t.y + cos(x) * y]
	}else{
		if(x[0] == "~") x = t.x + +x.slice(1)
		else if(x[0]=='!') x = m.x + +x.slice(1)
		else x -= 0
		if(y[0] == "~") y = t.y + +y.slice(1)
		else if(y[0]=='!') y = m.y + +y.slice(1)
		else y -= 0
	}
	if(x != x || y != y) throw 'Invalid coordinates'
	return {x, y, w}
}

export function log(who, msg){
	if(!GAMERULES.commandlogs) return msg
	if(who && !who.sock) who = null
	chat(prefix(who, 1) + msg, LIGHT_GREY + ITALIC, who)
}

function serializeTypePretty(type){
	if(Array.isArray(type)) return serializeTypePretty(type[0]) + '[' + (type[1]||'') + ']'
	if(type == Uint8) return 'integer [0 - 255]'
	else if(type == Int8) return 'integer [-128 - 127]'
	else if(type == Uint16) return 'integer [0 - 65535]'
	else if(type == Int16) return 'integer [-32768 - 32767]'
	else if(type == Uint32) return 'integer [0 - 4294967296]'
	else if(type == Int32) return 'integer'
	else if(type == Float || type == Double) return 'number'
	else if(type == String) return 'string'
	else if(type == Bool) return 'bool'
	else if(type == Uint8Array) return 'data'
	if(typeof type == 'function') return type.name
	let res = '{ '
	if(typeof type != 'object') throw 'what'
	for(const k in type){
		if(res.length != 2) res += ', '
		res += k + ': '
		res += serializeTypePretty(type[k])
	}
	return res += ' }'
}

function selector(a, who){
	if(!a) throw 'Selector missing'
	if(a == '!'){
		const m = marks.get(who)
		if(!m) throw 'No marker set'
		return [m.entity]
	}
	const id = +a
	if(id === id){
		const e = entityMap.get(id)
		if(!e) throw 'No such entity with ID '+id
		return [e]
	}
	if(a[0] == '@'){
		if(a[1] == 's'){if(who instanceof Entity) return [who]; else throw 'Self selector unavailable'}
		if(a[1] == 'e') return [...entityMap.values()]
		if(a[1] == 'n'){
			if(!who || !entityMap.delete(who.netId)) return [...entityMap.values()]
			const a = [...entityMap.values()]
			entityMap.set(who.netId, who)
			return a
		}
		const candidates = [...players.values()]
		if(!candidates.length) throw "No targets matched selector"
		if(a[1] == 'a') return candidates
		if(a[1] == 'p'){
			if(!who || who.clients) throw "No targets matched selector"
			const closest = candidates.winner(a => {
				if(a.world != who.world) return -Infinity
				const dx = a.x - who.x, dy = a.y - who.y
				return -(dx * dx + dy * dy)
			})
			return [closest]
		}
		if(a[1] == 'r') return [candidates[floor(random() * candidates.length)]]
	}else{
		const player = players.get(a)
		if(!player) throw "No targets matched selector"
		return [player]
	}
	throw 'Invalid selector'
}

let stack = null
export function err(e){
	if(!e.stack) return e
	stack = e.stack
	return e + '\nType /stacktrace to view full stack trace'
}

const ENTITYCOMMONDATA = {dx: Float, dy: Float, f: Float, age: Double}
const ITEMCOMMONDATA = {count: Uint8}

const marks = new WeakMap

export const commands = {
	__proto__: null,
	list(){
		let a = "Online players"
		for(let pl of players.values())a += '\n' + pl.name + ' ('+pl.health+')'
		return a
	},
	say(s, ...l){
		if(!l.length) throw 'Command usage: /say <style> <text...>\nExample: /say lime-bold Hello!'
		let col = 0, txt = s.includes('raw') ? l.join(' ') : prefix(this, 1) + l.join(' ')
		for(let [m] of (s.match(/bold|italic|underline|strike/g)||[]))col |= (m > 'i' ? m == 'u' ? 64 : 128 : m == 'b' ? 16 : 32)
		col += s.match(/()black|()dark[-_]?red|()dark[-_]?green|()(?:gold|dark[-_]?yellow)|()dark[-_]?blue|()dark[-_]?purple|()dark[-_]?(?:aqua|cyan)|()(?:light[-_]?)?gr[ea]y|()dark[-_]?gr[ea]y|()red|()(?:green|lime)|()yellow|()blue|()purple|()(?:aqua|cyan)|$/).slice(1).indexOf('') & 15
		chat(txt, col)
	},
	tpe(a, b){
		if(!b)b = a, a = '@s'
		const targets = selector(a, this)
		const [target, _] = selector(b, this)
		if(_ || !target) throw 'Selector must return exactly 1 target'
		const {x, y, world} = target
		for(const e of targets)
			e.x = x, e.y = y, e.world = world, e.sock && e.rubber(X | Y)
		if(targets.length>1) return log(this, `Teleported ${targets.length} entities to ${target.name}`)
		else return log(this, `Teleported ${targets[0].name} to ${target.name}`)
	},
	tp(a, _x, _y, d = this.world || 'overworld'){
		if(!_y)_y=_x,_x=a,a='@s'
		const targets = selector(a, this)
		const {x, y, w} = parseCoords(_x, _y, d, this)
		for(const e of targets)
			e.x = x, e.y = y, e.world = w, e.sock && e.rubber(X | Y)
		if(targets.length>1) return log(this, `Teleported ${targets.length} entities to (${x.toFixed(3)}, ${y.toFixed(3)}) in the ${w.id}`)
		else return log(this, `Teleported ${targets[0].name} to (${x.toFixed(3)}, ${y.toFixed(3)}) in the ${w.id}`)
	},
	kick(a, ...r){
		const reason = r.join(' ')
		const targets = selector(a, this)
		if(targets.length > 1 && this.sock.permissions < OP) throw 'Moderators may not kick more than 1 person at a time'
		stat('misc', 'player_kicks', targets.length)
		let kicked = 0
		for(const pl of targets){
			if(!pl.sock) continue
			pl.sock.send(reason ? '-12fYou were kicked for: \n'+reason : '-12fYou were kicked')
			pl.sock.close()
			kicked++
		}
		return log(this, `Kicked ${kicked} player(s)`)
	},
	give(sel, item, amount = '1', dat = '{}'){
		let itm = Items[item], c = max(amount | 0, 1)
		if(!itm) throw 'No such item: '+item
		let count = ''
		for(const player of selector(sel, this)){
			if(!count && player.sock) count = player.name
			else if(typeof count == 'string') count = 2-!count
			else count++
			const stack = new itm(c)
			snbt(dat, 0, stack, stack.savedata, ITEMCOMMONDATA)
			player.giveAndDrop(stack)
		}
		return log(this, 'Gave '+(typeof count=='number'?count+' players':count)+' '+item+'*'+c)
	},
	summon(type, _x = '~', _y = '~', _d = '~', data = '{}'){
		const {x, y, w} = parseCoords(_x, _y, _d, this)
		if(!(type in Entities)) throw 'No such entity: ' + type
		const e = new Entities[type]()
		snbt(data, 0, e, e.savedata, ENTITYCOMMONDATA)
		e.place(w, x, y)
		return log(this, 'Summoned a(n) '+type+' with an ID of '+e.netId)
	},
	mutate(sel, data){
		let i = 0
		for(const e of selector(sel, this)){
			i++
			snbt(data, 0, e, e.savedata, ENTITYCOMMONDATA)
			if(e.rubber) e.rubber()
		}
		return log(this, 'Successfully mutated '+i+' entities')
	},
	setblock(_x = '~', _y = '~', type, _d = '~', data = '{}'){
		const {x, y, w} = parseCoords(_x, _y, _d, this)
		let b
		if(type == (type & 65535)){
			type = type & 65535
			if(type >= BlockIDs.length) throw 'No such block ID: ' + type
			b = BlockIDs[type]
		}else{
			if(!(type in Blocks)) throw 'No such block: ' + type
			b = Blocks[type]
		}
		snbt(data, 0, b, b.savedata)
		goto(w, floor(x), floor(y))
		place(b)
		return log(this, 'Set block at ('+(floor(x)|0)+', '+(floor(y)|0)+') to '+type+(data=='{}'?'':' (+data)'))
	},
	fill(_x, _y, _x2, _y2, type, d = this.world || 'overworld'){
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
		let count = x2*y2+x2+y2+1
		if(count > CONFIG.permissions.max_fill) throw 'Cannot /fill more than '+CONFIG.permissions.max_fill+' blocks'
		for(y = 0; y != y2+1; y=(y+1)|0){
			for(x = 0; x != x2+1; x=(x+1)|0){
				if(peek()==b)count--
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
		let dict, list, name, data = cat.endsWith('data')
		switch(data ? cat.slice(0, -4) : cat){
			case 'block': dict = Blocks, list = BlockIDs, name = 'Block'; break
			case 'item': dict = Items, list = ItemIDs, name = 'Item'; break
			case 'entity': dict = Entities, list = EntityIDs, name = 'Entity'; break
			default: throw 'Allowed categories: block, item, entity, blockdata, itemdata, entitydata'
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
		if(data && obj.savedata){
			res += ' and has data attributes:\n' + serializeTypePretty(obj.savedata)
		}else if(data) res += ' and has no data attributes'
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
			for(const id of e.allInterfaces??[]) e.allItems?.(id, (i, item) => {
				if(!item || (Con && item.constructor != Con)) return
				if(item.count <= max) e.setItem(id, i, null, true), max -= item.count
				else item.count -= max, max = 0, e.itemChanged(id, i, item)
			})
			cleared += _max - max
		}
		return log(this, `Cleared a total of ${cleared} items from ${typeof count=='number'?count+' entities':count}`)
	},
	help(c){
		const perm = this.isServer ? OP : this.sock ? this.sock.permissions : 0
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
	time(time, d = this.world || 'overworld'){
		if(typeof d == 'string')d = Dimensions[d]
		if(!d) throw 'Invalid dimension'
		if(!time){
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
			if(t >= 12000)d.tick += (24000 - t)
			else d.tick -= t
		}
		return log(this, 'Set the '+d.id+' time to '+d.tick)
	},
	weather(type, duration, w = this.world.id){
		const world = Dimensions[w] ?? this.world
		if(world != Dimensions.overworld) throw 'This command is not available for this dimension'
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
		return 'Set the weather to '+type+(world.weather?' for '+round(duration/currentTPS)+'s':'')
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
	spawnpoint(x='~',y='~',d=this.world||'overworld'){
		if(x.toLowerCase() == 'tp') // For the /spawnpoint tp [entity] syntax
			return commands.tp.call(this, y || '@s', GAMERULES.spawnx, GAMERULES.spawny, GAMERULES.spawnworld)
		void ({x: GAMERULES.spawnx, y: GAMERULES.spawny, w: {id: GAMERULES.spawnworld}} = parseCoords(x,y,d,this))
		return log(this, `Set the spawn point to (${GAMERULES.spawnx.toFixed(2)}, ${GAMERULES.spawny.toFixed(2)}) in the ${GAMERULES.spawnworld}`)
	},
	info(){
		return `Vanilla server software ${version}\nUptime: ${Date.formatTime(Date.now() - started)}, CPU: ${(perf.elu[0]*100).toFixed(1)}%, RAM: ${(perf.mem[0]/1048576).toFixed(1)}MB` + (this.age ? '\nTime since last death: ' + Date.formatTime(this.age * 1000 / currentTPS) : '')
	},
	tps(tps){
		if(!tps) return 'The TPS is '+currentTPS
		setTPS(max(1, min((tps|0) || 20, 1000)))
		for(const pl of players.values()){
			pl.sock.r--; pl.rubber(0)
		}
		return log(this, 'Set the TPS to '+currentTPS)
	},
	kill(t = '@s', cause = 'void'){
		if(this.sock.permissions < MOD){
			if(!CONFIG.permissions.suicide) throw 'This server does not permit suicide'
			if(t != '@s'/* || cause != 'void'*/) throw 'You do not have permission to use /kill against other players'
		}
		const c = damageTypes[cause] || 0
		let i = 0
		for(const e of selector(t, this)){
			e.kill(c); i++
		}
		return log(this, 'Killed '+i+' entities')
	},
	async regen(_x, _y, type, _w){
		let {x, y, w} = parseCoords(_x, _y, _w, this)
		x = floor(x) >>> 6; y = floor(y) >>> 6
		let [a, b] = type ? type.split('/',2) : [w.gend,w.genn]
		if(!b)b=a,a=w.id
		const chunk = w.chunk(x, y)
		if(!chunk) throw 'Chunk not loaded'
		chunk.t = 2147483647
		const buf = new DataReader(await generator(x, y, a, b))
		chunk.parse(buf)
		const delw = new DataWriter()
		delw.byte(17), delw.int(x), delw.int(y)
		const del = delw.build()
		for(const sock of chunk.sockets)
			sock.send(del), sock.send(Chunk.diskBufToPacket(buf, x, y))
		goto(this)
		let moved = false
		while((floor(this.y)&63|!moved) && peek().solid)
			this.y = floor(this.y) + 1, moved = true, up()
		if(moved) this.rubber(Y)
		return log(this, `Regenerated chunk located at (${x<<6}, ${y<<6}) in the ${w.id}`)
	},
	perm(u = '@s', a='default'){
		if(!Object.hasOwn(PERMS, a)) throw 'Invalid permission'
		a = PERMS[a]
		let count = ''
		if(u[0] != '@'){
			PERMISSIONS[u] = a
			count = u
			const f = players.get(u)
			if(f) f.sock.permissions = a, f.rubber(0)
		}else for(const f of selector(u, this)){
			if(!f.sock | !f.name) continue
			if(count) count = typeof count == 'string' ? 2 : count+1
			else count = f.name
			PERMISSIONS[f.name] = a
			f.sock.permissions = a, f.rubber(0)
		}
		savePermissions()
		return log(this, 'Set the permission of '+(typeof count=='number'?count+' players':count)+' to '+a)
	},
	ban(u, a = 1e100){
		a = round(Date.now()/1000+(+a??1e100))
		let count = ''
		if(u[0] != '@'){
			PERMISSIONS[u] = a
			count = u
			const f = players.get(u)
			if(f){
				f.sock.permissions = a
				f.sock.send('-119You have been banned from this server')
				f.sock.close()
			}
		}else for(const f of selector(u, this)){
			if(!f.sock | !f.name) continue
			if(count) count = typeof count == 'string' ? 2 : count+1
			else count = f.name
			PERMISSIONS[f.name] = a
			pl.sock.send('-119You have been banned from this server'), pl.sock.close()
		}
		savePermissions()
		return log(this, 'Banned '+(typeof count=='number'?count+' players':count)+(a>=1e100?' permanently':' until '+new Date(a*1000).toLocaleString()))
	},
	as(t, c, ...a){
		for(const e of selector(t, this))
			executeCommand(c, a, e, 4)
	},
	repeat(k, c, ...a){
		k = min(k>>>0, 1e6)
		while(k--)
			executeCommand(c, a, this, 4)
	},
	mark(e='@s',xo='0',yo='0'){
		const [ent, ex] = selector(e, this)
		if(ex) throw '/mark only accepts one entity'
		const m = {x: ifloat(ent.x + (+xo||0)), y: ifloat(ent.y + (+yo||0)), world: ent.world, entity: ent}
		marks.set(this, m)
		return `Mark set at (${m.x.toFixed(3)}, ${m.y.toFixed(3)}) in the ${m.world.id}`
	},
	restart(delay = 0){
		if(!globalThis.process) throw '/restart is only available for multiplayer servers'
		delay *= 1000
		if(!(delay >= 0)) throw 'Invalid delay'
		setTimeout(process.emit.bind(process, 'SIGINT', 1), delay)
		if(delay) chat('[SERVER] Server restarting in '+Date.formatTime(delay), GOLD | BOLD | ITALIC, null)
	}
}
const PERMS = {
	0: 0, 1: 1, 2: 2, 3: 3, 4: 4,
	deny: 0, spectator: 1, visitor: 1,
	normal: 2, player: 2, get default(){return CONFIG.permissions.default},
	mod: 3, moderator: 3, staff: 3,
	op: 4, operator: 4, admin: 4
}

//Aliases
commands.stop = commands.restart
commands.i = commands.info
commands.op = function(u){return commands.perm.call(this,u,OP)}
commands.deop = function(u){return commands.perm.call(this,u,NORMAL)}

export const anyone_help = {
	help: '<cmd> -- Help for a command',
	list: '-- List online players',
	info: '-- Info about the server and yourself',
	i: ' (alias for /info)',
	kill: '-- Suicide'
}, mod_help = {
	...anyone_help,
	give: '[player] [item] (count=~) ',
	kick: '[player] -- Kick a player',
	say: '[style] [...msg] -- Send a message in chat',
	tp: '[targets] [x] [y] (dimension=~) -- teleport someone to a dimension',
	tpe: '[targets] [destEntity]',
	time: ['+[amount] -- Add to time', '-[amount] -- Substract from time', '[value] -- Set time', '-- Get current time'],
	summon: '[entity_type] (x) (y) (dimension=~) (snbt_data={}) -- Summon an entity',
	setblock: '[x] [y] [block_type] (dimension=~) (snbt_data={}) -- Place a block somewhere',
	clear: '[player] (filter_item=none) (max_amount=Infinity) -- Remove items from a player',
	fill: '[x0] [y0] [x1] [y1] [block_type] (dimension=~) -- Fill an area with a certain block',
	regen: '(x=~) (y=~) -- Re-generate this chunk with fresh terrain',
	kill: '[target] (cause=void) -- Kill a player or entity',
	mark: '[target] (x_off=0) (y_off=0) -- Set a marker point. Refer to your marker point by replacing position and entity selectors with !',
	id: '[block|item|entity|blockdata|itemdata|entitydata] ([name]|[id]) -- Get technical information about a block/item/entity from its name or ID'
}, help = {
	...mod_help,
	mutate: '[entity] [snbt_data] -- Change properties of an entity',
	gamerule: '[gamerule] [value] -- Change a gamerule, such as difficulty or default gamemode',
	tps: '[tps] -- Set server-side tps',
	spawnpoint: ['(x=~) (y=~) (dimension=~) -- Set the spawn point', 'tp (who=@s) -- Teleport entities to spawn'],
	perm: '[target] <int>|deny|spectator|normal|mod|op|default -- Set the permission level of a player',
	ban: '[target] (seconds) -- Ban a player for a specified amount of time (or indefinitely)',
	op: '[target] -- Alias for /perm [target] op',
	deop: '[target] -- Alias for /perm [target] normal',
	as: '[target] [...command] -- Execute a command as a target',
	repeat: '[count] [...command] -- Execute a command multiple times',
	restart: '(delay=0) -- Restart the server after delay'
}, cheats = ['give', 'summon', 'setblock', 'fill']
Object.setPrototypeOf(anyone_help, null)
Object.setPrototypeOf(mod_help, null)
Object.setPrototypeOf(help, null)
Function.optimizeImmediately(parseCoords, snbt, ...Object.values(commands))

export function executeCommand(name, params, player, perms = 0){
	if(!(name in commands)) throw 'No such command: /'+name
	if(perms < MOD){
		if(!anyone_help[name]) throw 'You do not have permission to use /'+name
	}else if(perms == MOD && !mod_help[name]) throw 'You do not have permission to use /'+name
	else if(perms == MOD && !CONFIG.permissions.mod_cheat && cheats.includes(name)) throw 'Server owner does not allow moderators to use /'+name
	stat('misc', 'commands_used')
	return commands[name].apply(player, params)
}
import { players, MOD, NORMAL } from '../world/index.js'
import { Dimensions, GAMERULES } from '../world/index.js'
import { chat, LIGHT_GREY, ITALIC, prefix } from './chat.js'
import { Entity } from '../entities/entity.js'
import '../node/internals.js'
import { entityMap } from '../world/tick.js'

export const marks = new WeakMap

const ID = /[a-zA-Z0-9_]*/y, NUM = /[+-]?(\d+(\.\d*)?|\.\d+)([Ee][+-]?\d+)?/y, BOOL = /1|0|true|false|/yi, STRING = /(['"`])((?!\1|\\).|\\.)*\1/y
const ESCAPES = {n: '\n', b: '\b', t: '\t', v: '\v', r: '\r', f: '\f'}
export function snbt(s, i, t, T1, T2){
	if(typeof t == 'object'){
		if(s[i] != '{') throw 'Expected dict literal'
		while(s[++i] == ' ');
		if(s[i] == '}') return
		while(true){
			ID.lastIndex = i
			const {0:k} = s.match(ID)
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
		let {0: T, 1: l = NaN} = T1 || T2
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

export function parseCoords(x = '~', y = '~', d = '~', t){
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

export function serializeTypePretty(type){
	if(Array.isArray(type)) return serializeTypePretty(type[0]) + '[' + (type[1]||'') + ']'
	if(type == Uint8) return 'integer [0 - 255]'
	else if(type == Int8) return 'integer [-128 - 127]'
	else if(type == Uint16) return 'integer [0 - 65535]'
	else if(type == Int16) return 'integer [-32768 - 32767]'
	else if(type == Uint32) return 'integer [0 - 4294967295]'
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
function testSelector(entity, ref, fns){
	for(const f of fns) if(!f(entity,ref)) return false
	return true
}
const comp = s => {
	const F = s === '=' ? 2 : s === '!=' ? 5 : s === '>=' ? 6 : s === '<=' ? 3 : s === '>' ? 4 : s === '<' ? 1 : 2
	return a => (F&(1<<sign(a)+1))!=0
}
const compstr = s => {
	return s === '!=' ? (a,b) => a != b : s === '>=' ? (a,b) => a.startsWith(b) : s === '<=' ? (a,b) => b.startsWith(a) : s === '>' ? (a,b) => a.length>b.length&&a.startsWith(b) : s === '<' ? (a,b) => b.length>a.length&&b.startsWith(a) : (a,b) => a==b
}
const specifiers = {
	__proto__: null,
	'type=': t => a => a.className === t,
	'type!=': t => a => a.className !== t,
	name: (t, s) => {
		const f = compstr(s)
		return a => f(a.name, t)
	},
	perms(t, s){
		const p = PERMS[t]
		if(p === undefined) return		
		const f = comp(s)
		return e => f((e.sock?.permissions??0)-p)
	},
	x(t, s){
		const p = ifloat(+t)
		if(!Number.isFinite(p)) return		
		const f = comp(s)
		return e => f(ifloat(e.x-p))
	},
	y(t, s){
		const p = ifloat(+t)
		if(!Number.isFinite(p)) return		
		const f = comp(s)
		return e => f(ifloat(e.y-p))
	},
}
export function selector(a, who){
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
		let arr
		if(a.length > 2 && (a[2] !== '[' || a[a.length-1] !== ']')) throw 'Unable to parse selector: expected []'
		const filters = []; let limit = Infinity
		if(a.slice(3,-1).replace(/\s*(\w+)\s*(=|>=|<=|!=|>|<)\s*([^=,;"\s\]]*|(?:"(?:[^"]|\\.)*"))\s*(?:,|;|$)|\s*(\d+)\s*(?:,|;|$)/gy, (_, a, s, b, c='') => {
			if(c) return void(limit = +c)
			if(b[0]=='"') try{ b = JSON.parse(b) }catch(e){ throw 'Unable to parse selector: invalid string' }
			const f = specifiers[a+s]?.(b) ?? specifiers[a]?.(b, s)
			if(!f) throw 'Invalid/unknown filter: '+a+s+b
			filters.push(f)
			return ''
		}).length > 3) throw 'Unable to parse selector: extra text inside []'
		if(!limit) throw "No targets matched selector"
		if(a[1] == 's'){
			if(!(who instanceof Entity)) throw '@s unavailable'
			if(testSelector(who, who, filters)) return [who]
			else throw "No targets matched selector"
		}else if(a[1] == 'e'){
			const arr = []
			for(const e of entityMap.values()){
				if(testSelector(e, who, filters)) arr.push(e)
				if(arr.length >= limit) break
			}
			if(!arr.length) throw "No targets matched selector"
			return arr
		}else if(a[1] == 'n'){
			const arr = []
			if(!who || !entityMap.delete(who.netId)){
				for(const e of entityMap.values()){
					if(testSelector(e, who, filters)) arr.push(e)
					if(arr.length >= limit) break
				}
			}else{
				for(const e of entityMap.values()){
					if(testSelector(e, who, filters)) arr.push(e)
					if(arr.length >= limit) break
				}
				entityMap.set(who.netId, who)
			}
			if(!arr.length) throw "No targets matched selector"
			return arr
		}else if(!players.size) throw "No targets matched selector"
		else if(a[1] == 'a'){
			const arr = []
			for(const e of players.values()){
				if(testSelector(e, who, filters)) arr.push(e)
				if(arr.length >= limit) break
			}
			if(!arr.length) throw "No targets matched selector"
			return arr
		}else if(a[1] == 'p'){
			if(!(who instanceof Entity)) throw "@p unavailable"
			const closest = [...players.values()].winner(a => {
				if(!testSelector(a, who, filters) || a.world != who.world) return NaN
				const dx = a.x - who.x, dy = a.y - who.y
				return -(dx * dx + dy * dy)
			})
			if(!closest) throw 'No targets matched selector'
			return [closest]
		}else if(a[1] == 'r'){
			const can = []
			for(const p of players.values())
				if(testSelector(p, who, filters)) can.push(p)
			if(!can.length) throw "No targets matched selector"
			else return can[floor(random()*can.length)]
		}
	}else{
		const player = players.get(a)
		if(!player) throw "No targets matched selector"
		return [player]
	}
	throw 'Invalid selector'
}

export let stack = null
export function err(e){
	if(!e.stack) return e
	stack = e.stack
	return e + '\nType /stacktrace to view full stack trace'
}
export const ENTITYCOMMONDATA = {dx: Float, dy: Float, f: Float, age: Double}
export const ITEMCOMMONDATA = {count: Uint8}

export const commands = {__proto__: null}
export const PERMS = {
	__proto__: null,
	0: 0, 1: 1, 2: 2, 3: 3, 4: 4,
	deny: 0, spectator: 1, visitor: 1,
	normal: 2, player: 2, get default(){return CONFIG.permissions.default},
	mod: 3, moderator: 3, staff: 3,
	op: 4, operator: 4, admin: 4
}
export const publicCommands = []
export function executeCommand(name, params, player, perms = 0){
	if(!(name in commands)) throw 'No such command: /'+name
	const j = params.findIndex(a=>a[0]=='/')
	if(perms < MOD){
		if(!publicCommands.includes(name)) throw 'You do not have permission to use /'+name
	}else if(perms == MOD && !mod_help[name]) throw 'You do not have permission to use /'+name
	else if(perms == MOD && !CONFIG.permissions.mod_cheat && cheats.includes(name)) throw 'Server owner does not allow moderators to use /'+name
	if(j > -1 && perms > NORMAL){
		const res = commands[name].apply(player, params.slice(0, j))
		if(res instanceof Promise) return res.then(res => {
			const res2 = executeCommand(params[j].slice(1), params.slice(j+1), player, perms)
			if(res2 instanceof Promise) return res2.then(res2 => res?(res2?res+'\n'+res2:res):res2)
			return res?(res2?res+'\n'+res2:res):res2
		})
		const res2 = executeCommand(params[j].slice(1), params.slice(j+1), player, perms)
		return res?(res2?res+'\n'+res2:res):res2
	}else return commands[name].apply(player, params)
}

Function.optimizeImmediately(parseCoords, snbt)
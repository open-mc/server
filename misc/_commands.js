import { players, MOD, NORMAL } from '../world/index.js'
import { Dimensions, GAMERULES } from '../world/index.js'
import { chat } from './chat.js'
import { Entity } from '../entities/entity.js'
import { entityMap } from '../world/tick.js'

export const marks = new WeakMap

const ID = /[a-zA-Z0-9_]*/y, NUM = /[+-]?(\d+(\.\d*)?|\.\d+)([Ee][+-]?\d+)?/y, BOOL = /1|0|true|false|/yi, STRING = /(['"`])((?!\1|\\).|\\.)*\1/y
const ESCAPES = {n: '\n', b: '\b', t: '\t', v: '\v', r: '\r', f: '\f'}

export const snbt = (s, t, T1, T2) => {try{return _snbt(s,0,t,T1,T2)}catch{throw 'invalid syntax in snbt'}}

function _snbt(s, i, t, T1, T2){
	if(typeof t == 'object'){
		if(s[i] != '{') throw 'expected dict literal'
		while(s[++i] == ' ');
		if(s[i] == '}') return
		while(true){
			ID.lastIndex = i
			const {0:k} = s.match(ID)
			if(!k.length) throw 'expected prop name in dict declaration in snbt'
			i = ID.lastIndex - 1
			while(s[++i] == ' ');
			if(s[i] != ':' && s[i] != '=') throw 'expected : or = after prop name in snbt'
			while(s[++i] == ' ');
			const T = T2[k] || T1[k]
			switch(T){
				case Int8: case Int16: case Int32: case Float32:
				case Uint8: case Uint16: case Uint32: case Float64:
				if((s[i] < '0' || s[i] > '9') && s[i] != '.' && s[i] != '-' && s[i] != '+') throw 'expected number for key '+k+' in snbt'
				NUM.lastIndex = i
				t[k] = T(+s.match(NUM)[0])
				i = NUM.lastIndex
				break
				case Boolean:
				BOOL.lastIndex = i
				switch(s.match(BOOL)[0][0]){
					case 't': case 'T': case '1':	t[k] = true; break
					case 'f': case 'F': case '0': t[k] = false; break
					default: throw 'expected boolean for key '+k+' in snbt'
				}
				i = BOOL.lastIndex
				case String:
				STRING.lastIndex = i
				const a = s.match(STRING)
				if(!a) throw 'expected string for key '+k
				t[k] = a.slice(1,-1).replace(/\\(x[a-fA-F0-9]{2}|u[a-fA-F0-9]{4}|.)/g, v => v.length > 2 ? String.fromCharCode(parseInt(v.slice(2))) : ESCAPES[v[1]] || v[1])
				break
				case undefined: case null: throw 'Key '+k+' invalid in snbt'
				default: i = _snbt(s, i, t[k])
			}
			i--
			while(s[++i] == ' ');
			if(i >= s.length || s[i] == '}') break
			else if(s[i] != ',' && s[i] != ';') throw 'expected , or ; after prop declaration in snbt'
			while(s[++i] == ' ');
		}
	}else if(Array.isArray(t)){
		if(s[i] != '[') throw 'expected array literal in snbt'
		while(s[++i] == ' ');
		let {0: T, 1: l = NaN} = T1 || T2
		if(s[i] == ']' && !l) return void(t.length=0);
		let j = -1
		while(true){
			if(++j == l) throw 'Too many elements in array literal in snbt'
			switch(T){
				case Int8: case Int16: case Int32: case Float32:
				case Uint8: case Uint16: case Uint32: case Float64:
				if((s[i] < '0' || s[i] > '9') && s[i] != '.' && s[i] != '-' && s[i] != '+') throw 'expected number for key '+k+' in snbt'
				NUM.lastIndex = i
				t[j] = T(+s.match(NUM)[0])
				i = NUM.lastIndex
				break
				case Boolean:
				BOOL.lastIndex = i
				switch(s.match(BOOL)[0][0]){
					case 't': case 'T': case '1':	t[j] = true; break
					case 'f': case 'F': case '0': t[j] = false; break
					default: throw 'expected boolean for key '+k+' in snbt'
				}
				i = BOOL.lastIndex
				case String:
				STRING.lastIndex = i
				const a = s.match(STRING)
				if(!a) throw 'expected string for key '+k+' in snbt'
				t[j] = a.slice(1,-1).replace(/\\(x[a-fA-F0-9]{2}|u[a-fA-F0-9]{4}|.)/g, v => v.length > 2 ? String.fromCharCode(parseInt(v.slice(2))) : ESCAPES[v[1]] || v[1])
				break
				case undefined: case null: throw 'Invalid array type in snbt (this is a bug, please report it)'
				default: i = _snbt(s, i, t[j])
			}
			if(j < l) throw 'Not enough elements in array literal in snbt'
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
	let w = (d == '~' ? t && t.world : d == '!' ? m.world : typeof d == 'string' ? Dimensions[d] : d?.world)
	if(!w) throw 'No such dimension'
	if(x[0] == "^" && y[0] == "^"){
		if(!t) throw '\'^\' coordinate specifier unavailable'
		x = (+x.slice(1))/180*PI - t.f
		y = +y.slice(1);
		[x, y] = [t.x - sin(x) * y, t.y + cos(x) * y]
	}else{
		if(x[0] == "~"){
			if(!t) throw '\'~\' coordinate specifier unavailable'
			x = t.x + +x.slice(1)
		}else if(x[0]=='!') x = m.x + +x.slice(1)
		else x -= 0
		if(y[0] == "~"){
			if(!t) throw '\'~\' coordinate specifier unavailable'
			y = t.y + +y.slice(1)
		}else if(y[0]=='!') y = m.y + +y.slice(1)
		else y -= 0
	}
	if(x != x || y != y) throw 'Invalid coordinates'
	return {x, y, w}
}

export function log(who, msg){
	if(!GAMERULES.commandlogs) return msg
	chat('\\27['+(who?.name||'!')+'] '+msg, who)
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
	if(!entity.world) return false
	for(const f of fns) if(!f(entity,ref)) return false
	return true
}
const comp = s => s === '=' ? a=>!a : s === '!=' ? a=>!!a : s === '>=' ? a=>a>=0 : s === '<=' ? a=>a<=0 : s === '>' ? a=>a>0 : s === '<' ? a=>a<0 : a=>false
const compstr = s => s === '!=' ? (a,b) => a != b : s === '>=' ? (a,b) => a.startsWith(b) : s === '<=' ? (a,b) => b.startsWith(a) : s === '>' ? (a,b) => a.length>b.length&&a.startsWith(b) : s === '<' ? (a,b) => b.length>a.length&&b.startsWith(a) : (a,b) => a==b
const flagSpecifiers = {

}
const specifiers = {
	__proto__: null,
	type(t, s){
		if(s=='=') return a => a.className === t
		else if(s=='!=') return a => a.className !== t
		else throw 'type only supports = and !=, '+s+' invalid'
	},
	name: (t, s) => {
		const f = compstr(s)
		return a => f(a.name, t)
	},
	perms(t, s, w){
		const p = t=='~' ? w&&w.sock ? w.sock.perms : undefined : PERMS[t]
		if(p === undefined) return
		const f = comp(s)
		return e => f((e.sock?.perms??0)-p)
	},
	x(t, s, w){
		const p = (t[0] == '~' ? w ? ifloat(w.x + +t.slice(1)) : NaN : ifloat(+t))
		if(!Number.isFinite(p)) return
		const f = comp(s)
		return e => f(ifloat(e.x-p))
	},
	y(t, s, w){
		const p = (t[0] == '~' ? w ? ifloat(w.y + +t.slice(1)) : NaN : ifloat(+t))
		if(!Number.isFinite(p)) return
		const f = comp(s)
		return e => f(ifloat(e.y-p))
	},
	f(t, s, w){
		if(s!='=') throw 'f only supports =, for a range use the format f=<degrees>+<tolerance>'
		const {0:a,1:b,2:c} = t.split('+')
		if(c!==undefined) return
		const ang = abs((+b||30)*PI/90)
		const p = (a[0] == '~' ? w ? (w.f + +a.slice(1))%PI2 : NaN : a%360)*PI/180 - ang*.5
		if(!Number.isFinite(p)) return
		return e => (e.f-p+PI2+PI2)%PI2<=ang
	},
	world(t, s, w){
		t = t == '~' ? w ? w.world : undefined : t ? Dimensions[t] : null
		if(t === undefined) throw 'Invalid world'
		if(s=='=') return a => a.world === t
		else if(s=='!=') return a => a.world !== t
		else throw 'world only supports = and !=, '+s+' invalid'
	},
	player: _ => e => !!e.sock,
	'!player': _ => e => !e.sock
}
export function selector(a, who){
	if(typeof a != 'string') throw 'Selector missing!'
	if(!a){ if(!who) throw 'Self unavailable'; return [who] }
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
		if(a.length > 2 && (a[2] !== '[' || a[a.length-1] !== ']')) throw 'Unable to parse selector: expected ] for matching ['
		const filters = []; let limit = Infinity
		if(a.slice(3,-1).replace(/\s*(?:(\d+)|(!?\w+)\s*(?:(=|>=|<=|!=|>|<)\s*([^=,;"\s\]]*|(?:"(?:[^"]|\\.)*")))?)\s*(?:,|;|$)/gy, (_, c, a, s, b) => {
			if(c) return limit = +c, ''
			if(b&&b[0]=='"') try{ b = JSON.parse(b) }catch{ throw 'Unable to parse selector filter: invalid string' }
			const f = specifiers[a]
			if(!f) throw 'Unknown filter: '+a
			if(!s&&f.length>1) throw 'Incorrect filter usage: '+a
			else if(s&&f.length<2) throw 'Incorrect filter usage: '+a+s
			const v = s ? f(b, s, who) : f(who)
			if(!v) throw 'Invalid filter: '+a+s+b
			filters.push(v)
			return ''
		}).length > 3) throw 'Unable to parse selector filter: extra text inside []'
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
			const closest = [...players.values()].best(a => {
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
	if(!e.stack) return '\\+9'+e
	stack = e.stack
	return '\\+9' + e + '\nType /stacktrace to view full stack trace'
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
export const publicCommands = [], modCommands = []
export function executeCommand(name, params, player, perms = 0){
	if(!(name in commands)) throw 'No such command: /'+name
	const j = params.findIndex(a=>a[0]=='/')
	if(perms < MOD){
		if(!publicCommands.includes(name)) throw 'You do not have permission to use /'+name
	}else if(perms == MOD && !modCommands.includes(name)) throw 'You do not have permission to use /'+name
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

Function.optimizeImmediately(parseCoords, _snbt)
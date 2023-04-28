import { stat } from "../../config.js"
import { optimize } from "../../internals.js"
import { getX, getY, up, jump, peek, right, destroy, select, goto } from "../../misc/ant.js"
import { DXDY } from "../misc/playerentity.js"

const DIAMETER = 41, LEFT = DIAMETER - 1 >>> 1
const buffer = new Int32Array(DIAMETER * DIAMETER * 2)

let x = 0, y = 0
const get = (xo=0,yo=0) => buffer[x+xo + LEFT + (y+yo + LEFT) * DIAMETER]
const set = a => buffer[x + LEFT + (y + LEFT) * DIAMETER] = a
export function explode(entity, strength = 100, fire = false){
	stat('world', 'explosions')
	buffer.fill(0); x = y = 0
	if(entity){
		goto(entity)
		entity.remove()
	}
	set(strength -= peek().blast)
	if(strength > 0) destroy()
	else return
	up(); y = 1
	for(let i = 1; i < LEFT; i++){
		y = -i; jump(1,-2*i); x++
		while(y <= i){
			const {blast} = peek()
			let v
			if(y == -i) v = get(-1,1)-blast*(2-(i&1))
			else if(y < i) v = get(-1,0)-blast
			else v = get(-1,-1)-blast*(2-(i&1))
			if(v > 0) destroy(), set(v)
			up(); y++
		}
	}
	jump(-x,1-y); x = 0; y = 1
	for(let i = 1; i < LEFT; i++){
		y = -i; jump(-1,-2*i); x--
		while(y <= i){
			const {blast} = peek()
			let v
			if(y == -i) v = get(1,1)-blast*(2-(i&1))
			else if(y < i) v = get(1,0)-blast
			else v = get(1,-1)-blast*(2-(i&1))
			if(v > 0) destroy(), set(v)
			up(); y++
		}
	}
	jump(-x,-y); x = y = 0
	for(let i = 1; i < LEFT; i++){
		x = 1-i; jump(2-2*i,1); y++
		while(x < i){
			const {blast} = peek()
			const v = get(0,-1)-blast
			if(v > 0) destroy(), set(v)
			right(); x++
		}
	}
	jump(-x,-y); x = y = 0
	for(let i = 1; i < LEFT; i++){
		x = 1-i; jump(2-2*i,-1); y--
		while(x < i){
			const {blast} = peek()
			const v = get(0,1)-blast
			if(v > 0) destroy(), set(v)
			right(); x++
		}
	}
	jump(-x,-y); x = getX(); y = getY()
	select(-LEFT, -LEFT, LEFT, LEFT, e => {
		let dx = e.x - x, dy = e.y - y
		const dmg = buffer[(floor(dx+LEFT)|0) + (floor(dy+LEFT)|0)*DIAMETER]
		const d = sqrt(dx * dx + dy * dy)
		dx /= d; dy /= d
		e.dx += dx * dmg / 4; e.dy += dy * dmg / 4
		e.damage?.(round(dmg / 4))
		e.rubber?.(DXDY)
	})
}
optimize(explode)
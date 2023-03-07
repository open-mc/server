import { TPS } from "../config.js"
import { optimize } from "../internals.js"
import { goto, peekat } from "../misc/ant.js"

const dt = 1 / TPS
const { floor, ceil, min, max, ifloat } = Math

export function stepEntity(e){
	e.state = (e.state & 0xffff) | (e.state << 8 & 0xff000000) | fastCollision(e, e.dx * dt, e.dy * dt) << 16
	if(e.state & 1)e.dy = 0
	else{
		e.dy += dt * e.world.gy * e.gy
		e.dy = e.dy * e.airDrag ** dt
		e.dx += dt * e.world.gx * e.gx
	}
	e.dx = e.dx * (e.state & 0x10000 ? e.groundDrag : e.airDrag / 2) ** dt
}

export const EPSILON = .0001
function fastCollision(e, dx, dy){
	let x = e.x, y = e.y
	let flags = 0
	const x0 = floor(x - e.width + EPSILON), x1 = ceil(x + e.width - EPSILON) - x0
	const y0 = floor(y + EPSILON), y1 = ceil(y + e.height - EPSILON) - y0
	goto(x0, y0, e.world)
	y: if(dy > 0){
		const ey = ceil(e.y + e.height + dy - EPSILON) + 1 - y0
		for(let y = y1; y < ey; y++){
			for(let x = 0; x < x1; x++){
				const ys = y - peekat(x, y - 1).solid
				if(ys == y || ys + y0 < e.y + e.height - EPSILON)continue
				e.y = min(ys + y0 - e.height, e.y + dy)
				e.dy = 0
				break y
			}
		}
		y = ifloat(e.y + dy)
	}else if(dy < 0){
		const ey = floor(e.y + dy + EPSILON) - 1 - y0
		for(let y = 0; y > ey; y--){
			for(let x = 0; x < x1; x++){
				const ys = y + peekat(x, y).solid
				if(ys == y || ys + y0 > e.y + EPSILON)continue
				e.y = max(ys + y0, e.y + dy)
				e.dy = 0
				flags |= 1
				break y
			}
		}
		y = ifloat(e.y + dy)
	}
	x: if(dx > 0){
		const ex = ceil(e.x + e.width + dx - EPSILON) + 1 - x0
		for(let x = x1; x < ex; x++){
			for(let y = 0; y < y1; y++){
				const xs = x - peekat(x - 1, y).solid
				if(xs == x || xs + x0 < e.x + e.width - EPSILON)continue
				e.x = min(xs + x0 - e.width, e.x + dx)
				e.dx = 0
				break x
			}
		}
		x = ifloat(e.x + dx)
	}else if(dx < 0){
		const ex = floor(e.x - e.width + dx + EPSILON) - 1 - x0
		for(let x = 0; x > ex; x--){
			for(let y = 0; y < y1; y++){
				const xs = x + peekat(x, y).solid
				if(xs == x || xs + x0 > e.x - e.width + EPSILON)continue
				e.x = max(xs + x0 + e.width, e.x + dx)
				e.dx = 0
				break x
			}
		}
		x = ifloat(e.x + dx)
	}
	e.move(x, y)
	return flags
}

optimize(stepEntity)
optimize(fastCollision)
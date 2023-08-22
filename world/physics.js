import { optimize } from '../internals.js'
import { goto, load, peekat, save } from '../misc/ant.js'
import { current_tps } from './tick.js'

export function stepEntity(e, dt = 1 / current_tps){
	if(e.state & 1)e.dy = 0
	else{
		e.dy += dt * e.world.gy * e.gy
		e.dy = e.dy * e.yDrag ** dt
		e.dx += dt * e.world.gx * e.gx
	}
	e.dx = e.dx * (e.impactDy < 0 ? e.groundDrag : e.airDrag) ** dt

	// Entity collision
	const x0 = e.x - e.width - e.collisionTestPadding, x1 = e.x + e.width + e.collisionTestPadding
	const y0 = e.y - e.collisionTestPadding, y1 = e.y + e.height + e.collisionTestPadding
	const cx0 = floor(x0 - 16) >>> 6, cx1 = ceil((x1 + 16) / 64) & 0x3FFFFFF
	const cy0 = floor(y0) >>> 6, cy1 = ceil((y1 + 32) / 64) & 0x3FFFFFF
	for(let cx = cx0; cx != cx1; cx = cx + 1 & 0x3FFFFFF){
		for(let cy = cy0; cy != cy1; cy = cy + 1 & 0x3FFFFFF){
			const chunk = e.chunk && (e.chunk.x == cx & e.chunk.y == cy) ? e.chunk : e.world && e.world.get(cx+cy*0x4000000)
			if(!chunk || !chunk.tiles) continue
			for(const e2 of chunk.entities){
				const {collisionTestPadding: ctp} = e2
				if(!e2.world || e2.netId <= e.netId || e2.x + e2.width + ctp < x0 || e2.x - e2.width - ctp > x1 || e2.y + e2.height + ctp < y0 || e2.y - ctp > y1) continue
				e.touch?.(e2)
				e2.touch?.(e)
			}
		}
	}
	e.age++
	e.update?.()
}

export const EPSILON = .0001
export function fastCollision(e, dt = 1 / current_tps){
	const dx = e.dx * dt, dy = e.dy * dt
	const x = e.x, y = e.y
	e.state &= 0xFFFF
	e.impactDx = e.impactDy = 0
	const x0 = floor(x - e.width + EPSILON), xw = ceil(x + e.width - EPSILON) - x0
	const y0 = floor(y + EPSILON), yh = ceil(y + e.height - EPSILON) - y0
	goto(x0, y0, e.world)
	y: if(dy > 0){
		const ey = ceil(e.y + e.height + dy - EPSILON) + 1 - y0
		for(let y = yh; y < ey; y++){
			for(let x = 0; x < xw; x++){
				const block = peekat(x, y - 1)
				const ys = y - block.solid
				if(ys == y | ys + y0 < e.y + e.height - EPSILON)continue
				e.y = min(ys + y0 - e.height, e.y + dy)
				e.impactDy = e.dy
				e.dy = 0
				break y
			}
		}
		e.y = ifloat(e.y + dy)
	}else if(dy < 0){
		const ey = floor(e.y + dy + EPSILON) - 1 - y0
		for(let y = 0; y > ey; y--){
			for(let x = 0; x < xw; x++){
				const block = peekat(x, y)
				const ys = y + block.solid
				if(ys == y | ys + y0 > e.y + EPSILON)continue
				e.y = max(ys + y0, e.y + dy)
				e.impactDy = e.dy
				e.dy = 0
				break y
			}
		}
		e.y = ifloat(e.y + dy)
	}
	x: if(dx > 0){
		const ex = ceil(e.x + e.width + dx - EPSILON) + 1 - x0
		for(let x = xw; x < ex; x++){
			for(let y = 0; y < yh; y++){
				const block = peekat(x - 1, y)
				const xs = x - block.solid
				if(xs == x | xs + x0 < e.x + e.width - EPSILON)continue
				e.x = min(xs + x0 - e.width, e.x + dx)
				e.impactDx = e.dx
				e.dx = 0
				break x
			}
		}
		e.x = ifloat(e.x + dx)
	}else if(dx < 0){
		const ex = floor(e.x - e.width + dx + EPSILON) - 1 - x0
		for(let x = 0; x > ex; x--){
			for(let y = 0; y < yh; y++){
				const block = peekat(x, y)
				const xs = x + block.solid
				if(xs == x | xs + x0 > e.x - e.width + EPSILON)continue
				e.x = max(xs + x0 + e.width, e.x + dx)
				e.impactDx = e.dx
				e.dx = 0
				break x
			}
		}
		e.x = ifloat(e.x + dx)
	}
	{
		const x0 = floor(x - e.width + EPSILON), xw = ceil(x + e.width - EPSILON) - x0
		const y0 = floor(y + EPSILON), yh = ceil(y + e.height - EPSILON) - y0
		goto(x0, y0, e.world)
		const p = save()
		a: for(let y = yh - 1; y >= 0; y--)
			for(let x = xw - 1; x >= 0; x--){
				const b = peekat(x, y)
				if(b.touched)if(b.touched(e)){load(p);break a}else load(p)
			}
	}
}

optimize(stepEntity)
optimize(fastCollision)
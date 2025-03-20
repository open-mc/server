import { jitterNoise, cmpxchgat, jump, placeat } from "./chunk.js"

let ltx = 0, lty = 0, ltdx = 0, ltdy = 0, rtdx = 0, rtdy = 0
let ix = 0, iy = 0
let begx = 0, begy = 0, endx = 0, endy = 0
const sign = (x, y) => {
	const a = x*ix+y*iy
	return a>0&&a<1 && ((x - ltx) * ltdy - (y - lty) * ltdx) * ((x + ltx) * rtdy - (y + lty) * rtdx) <= 0
}

export const Vein = (rad = 2, block, test = null, first = true) => {
	const i = jitterNoise(), jx = (i&65535)*.152587890625e-4-.5, jy = (i>>>16)*.152587890625e-4-.5
	if(first){
		const r = rad*rad, r1 = ceil(rad+.5)
		if(test) for(let x=-r1;x<=r1;x++) for(let y=-r1;y<=r1;y++){
			if((x-jx)*(x-jx)+(y-jy)*(y-jy)<r) cmpxchgat(x,y,test,block)
		}else for(let x=-r1;x<=r1;x++) for(let y=-r1;y<=r1;y++)
			if((x-jx)*(x-jx)+(y-jy)*(y-jy)<r) placeat(x,y,block)
	}
	return (newRad, x = 0, y = 0) => {
		const d = 1 / hypot(x, y), d0 = d*rad, d1 = d*(rad = newRad)
		ltx = -y*d0, lty = x*d0; ix = x*d*d, iy = y*d*d
		ltdx = x-y*d1, ltdy = y+x*d1, rtdx = x+y*d1, rtdy = y-x*d1
		begx = floor(min(-abs(ltx), ltdx, rtdx)+jx); begy = floor(min(-abs(lty), ltdy, rtdy)+jy)
		endx = ceil(max(abs(ltx), ltdx, rtdx)+jx); endy = ceil(max(abs(lty), ltdy, rtdy)+jy)
		ltdx -= ltx; ltdy -= lty; rtdx += ltx; rtdy += lty
		if(test) for(let x=begx;x<endx;x++) for(let y=begy;y<endy;y++){
			if(sign(x-jx, y-jy)) cmpxchgat(x, y, test, block)
		}else for(let x=begx;x<endx;x++) for(let y=begy;y<endy;y++)
			if(sign(x-jx, y-jy)) placeat(x, y, block)
		jump(x, y)
		const r = rad*rad, r1 = ceil(rad+.5)
		if(test) for(let x=-r1;x<=r1;x++) for(let y=-r1;y<=r1;y++){
			if((x-jx)*(x-jx)+(y-jy)*(y-jy)<r) cmpxchgat(x,y,test,block)
		}else for(let x=-r1;x<=r1;x++) for(let y=-r1;y<=r1;y++)
			if((x-jx)*(x-jx)+(y-jy)*(y-jy)<r) placeat(x,y,block)
	}
}
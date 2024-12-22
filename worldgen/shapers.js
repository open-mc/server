import { Shapers } from "./globals.js"
import { Noise1D } from "./util/random.js"

const oNoise = Noise1D('overworld.offset', 512), tNoise = Noise1D('temperature', 1024), hNoise = Noise1D('humidity', 512)
Shapers.overworld = (amplification = 1) => {
	if(Number.isNaN(amplification -= 0)) amplification = 1
	const a = -6/amplification
	return (x, y, o) => {
		let off = oNoise(x)
		if(off>0){
			// x += 4x^4
			const p = off*off
			off += p*p*4
		}
		off = (off+.25)*128
		o.offset = (y-=off)*a/(off+160)
		const t = tNoise(x) + min(.3, max(-.3, y*.005))
		const h = hNoise(x)
		o.temperature = t*.5+.5
		o.humidity = h*.5+.5
	}
}

Shapers.uniform = (v=0) => (v=v*4-2, (x, y, o) => { o.offset = v, o.temperature = .5, o.humidity = .5 })

Shapers.flat = (y0=0) => (x, y, o) => { o.offset = (y-y0)*-2000, o.temperature = .5, o.humidity = .5 }

Shapers.void = () => (x, y, o) => { o.offset = -2000, o.temperature = .5, o.humidity = .5 }
Shapers.filled = () => (x, y, o) => { o.offset = 2000, o.temperature = .5, o.humidity = .5 }

Shapers.nether = (period = 2048) => {
	if(Number.isNaN(period = 1/period)) period = 1/2048
	return (x, y, o) => {
		const a = (y*period)%1 + (y<0)
		o.offset = a < .5 ? 3.2*a-1 : a > .6875 ? 2.2-3.2*a : 22-32*a
		const h = hNoise(x)
		o.temperature = 1
		o.humidity = h*.5+.5
	}
}

Shapers.end = (period = 2048) => {
	if(Number.isNaN(period = 1/period)) period = 1/2048
	return (x, y, o) => {
		const ax = 96-abs(x)
		o.offset = y > 0 ? (ax*.06-y)*.2 : (ax*.5+y)*.1
		o.temperature = 0
		o.humidity = 0.5
	}
}
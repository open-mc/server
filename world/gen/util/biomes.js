import { imxs32 } from './random.js'
import { PNG } from 'pngjs'
import fs from 'fs/promises'
import { Biomes, chunkBiomes } from '../vars.js'
const biomemap = []
biomemap.buffer = new DataView(await new Promise(async r => new PNG().parse(await fs.readFile(PATH + '/util/biomes.png'), (_,a)=>r(a.data.buffer))))
await Promise.all((await fs.readdir(PATH+'/biomes')).map(a=>import(PATH+'/biomes/'+a)))
const biomeconvert = {
	0x2eb300: Biomes.plains,
	0x0048b3: Biomes.ocean,
	0x757575: Biomes.rocky,
	0xd7d05c: Biomes.desert,
	0x0000ff: Biomes.river,
	0xeeeeee: Biomes.snowy
}
for(let i = 0; i < biomemap.buffer.byteLength; i+=4){
	const b = biomeconvert[biomemap.buffer.getUint32(i) >>> 8]
	if(!b)console.error('\x1b[31mMissing biome mapping for color 0x'+(biomemap.buffer.getUint32(i)>>>8).toString(16).padStart(6,'0')),process.exit(0)
	biomemap.push(b)
}
const maps = new Map()
const t = new Float32Array(18)
export function biomesheet(x){
	let sheet = maps.get(x)
	if(sheet)return sheet
	sheet = new Uint8ClampedArray(258)
	let g0 = imxs32(x, -994417718), g1 = imxs32(x, 65013760)
	let g2 = imxs32(x + 1, -994417718)
	const tl1 = (g0 << 1 & 510) - 255
	const tr1 = (g2 << 1 & 510) - 255
	const tl2 = (g0 >> 7 & 510) - 255
	const tr2 = (g2 >> 7 & 510) - 255
	g0 >>= 16
	let i = 0, j = 0
	for(;i<129;i++,j+=0.0078125){
		sheet[i] = j * (1-j) * (1-j) * tl1 - (1-j) * j * j * tr1 + 128
	}for(j=0;i<258;i++,j+=0.0078125){
		sheet[i] = j * (1-j) * (1-j) * tl2 - (1-j) * j * j * tr2 + 128
	}
	t[0] = (g0 & 57344) / 28672 - 1
	t[1] = (g0 & 7168) / 3584 - 1
	t[2] = (g0 & 896) / 448 - 1
	t[3] = (g0 & 112) / 56 - 1
	t[4] = (g1 & 14680064) / 7340032 - 1
	t[5] = ((g0 & 1) + (g1 >> 29)) / 3.5 - 1
	t[6] = (g1 & 939524096) / 469762048 - 1
	t[7] = (g1 & 117440512) / 58720256 - 1
	t[8] = (g2 & 57344) / 28672 - 1
	t[9] = (g0 & 14) / 7 - 1
	t[10] = (g1 & 1835008) / 917504 - 1
	t[11] = (g1 & 229376) / 114688 - 1
	t[12] = (g1 & 28672) / 14336 - 1
	t[13] = (g1 & 3584) / 1792 - 1
	t[14] = (g1 & 448) / 224 - 1
	t[15] = (g1 & 56) / 28 - 1
	t[16] = (g1 & 7) / 3.5 - 1
	t[17] = (g2 & 14) / 7 - 1
	for(i=0,j=0;i<129;i++,j=(j+0.0625)%1){
		sheet[i] += (j * (1-j) * (1-j) * t[i >> 4] - (1-j) * j * j * t[(i >> 4) + 1]) * 256
	}for(j=0;i<258;i++,j=(j+0.0625)%1){
		sheet[i] += (j * (1-j) * (1-j) * t[(i + 15) >> 4] - (1-j) * j * j * t[(i + 31) >> 4]) * 256
	}
	if(maps.size>50)for(const k of maps.keys()){maps.delete(k);break}
	/*for(let i = 0; i <= 128; i++){
		s.push(biomemap[(sheet[i] * 15.99 + 15.99 << 5) | (sheet[i+129] * 15.99 + 15.99 << 0)])
	}*/
	maps.set(x, sheet)
	return sheet
}
const biomes = [Biomes.void, Biomes.void, Biomes.void, Biomes.void, Biomes.void]
export const biomesFor = (cx) => {
	const b = biomesheet(cx >> 5)
	let i = (cx & 31) << 2
	biomes[0] = biomemap[(chunkBiomes[0] = b[  i]) >> 3 | (chunkBiomes[1] = b[i + 129]) >> 3 << 5]
	biomes[1] = biomemap[(chunkBiomes[2] = b[++i]) >> 3 | (chunkBiomes[3] = b[i + 129]) >> 3 << 5]
	biomes[2] = biomemap[(chunkBiomes[4] = b[++i]) >> 3 | (chunkBiomes[5] = b[i + 129]) >> 3 << 5]
	biomes[3] = biomemap[(chunkBiomes[6] = b[++i]) >> 3 | (chunkBiomes[7] = b[i + 129]) >> 3 << 5]
	biomes[4] = biomemap[(chunkBiomes[8] = b[++i]) >> 3 | (chunkBiomes[9] = b[i + 129]) >> 3 << 5]
	return biomes
}
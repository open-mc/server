/*export const BlockShape = (a,b=-1,c,d,e,f,g,h,i,j,k,l,m,n,o,p) => {
	if(b===-1){
		let x
		return Uint16Array.of(
			x = (a&32768)*1.875|(a&16384)*0.234375|(a&8192)*0.029296875|(a&4096)*0.003662109375, x, x, x,
			x = (a&2048)*30|(a&1024)*3.75|(a&512)*0.46875|(a&256)*0.05859375, x, x, x,
			x = (a&128)*480|(a&64)*60|(a&32)*7.5|(a&16)*0.9375, x, x, x,
			x = (a&8)*7680|(a&4)*960|(a&2)*120|(a&1)*15, x, x, x,
			a, a
		)
	}
	return Uint16Array.of(
		a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p,
		!!((a|b|c|d)&61440) | !!((a|b|c|d)&3840)<<1 | !!((a|b|c|d)&240)<<2 | !!((a|b|c|d)&15)<<3 | !!((e|f|g|h)&61440)<<4 | !!((e|f|g|h)&3840)<<5 | !!((e|f|g|h)&240)<<6 | !!((e|f|g|h)&15)<<7 | !!((i|j|k|l)&61440)<<8 | !!((i|j|k|l)&3840)<<9 | !!((i|j|k|l)&240)<<10 | !!((i|j|k|l)&15)<<11 | !!((m|n|o|p)&61440)<<12 | !!((m|n|o|p)&3840)<<13 | !!((m|n|o|p)&240)<<14 | !!((m|n|o|p)&15)<<15, !(~(a&b&c&d)&61440) | !(~(a&b&c&d)&3840) << 1 | !(~(a&b&c&d)&240) << 2 | !(~(a&b&c&d)&15) << 3 | !(~(e&f&g&h)&61440) << 4 | !(~(e&f&g&h)&3840) << 5 | !(~(e&f&g&h)&240) << 6 | !(~(e&f&g&h)&15) << 7 | !(~(i&j&k&l)&61440) << 8 | !(~(i&j&k&l)&3840) << 9 | !(~(i&j&k&l)&240) << 10 | !(~(i&j&k&l)&15) << 11 | !(~(a&b&c&d)&61440) << 12 | !(~(a&b&c&d)&3840) << 13 | !(~(a&b&c&d)&240) << 14 | !(~(a&b&c&d)&15) << 15
	)
}

BlockShape.SLAB = BlockShape(0x00FF)
BlockShape.UPPER_SLAB = BlockShape(0xFF00)
BlockShape.STAIRS_RIGHT = BlockShape(0xCCFF)
BlockShape.STAIRS_LEFT = BlockShape(0x33FF)
BlockShape.UPPER_STAIRS_RIGHT = BlockShape(0xFFCC)
BlockShape.UPPER_STAIRS_LEFT = BlockShape(0xFF33)
BlockShape.VERTICAL_THIN = BlockShape(0x6666)
BlockShape.HORIZONTAL_THIN = BlockShape(0x0FF0)
BlockShape.ONE_SHORT = BlockShape(
	0x0000, 0xFFFF, 0xFFFF, 0xFFFF,
	0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF,
	0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF,
	0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF
)*/
export const BlockShape = {}
BlockShape.SLAB = [0, 0, 1, 0.5]
BlockShape.UPPER_SLAB = [0, 0.5, 1, 1]
BlockShape.STAIRS_RIGHT = [0, 0, 1, 0.5, 0, 0.5, 0.5, 1]
BlockShape.STAIRS_LEFT = [0, 0, 1, 0.5, 0.5, 0.5, 1, 1]
BlockShape.UPPER_STAIRS_RIGHT = [0, 0.5, 1, 1, 0, 0, 0.5, 0.5]
BlockShape.UPPER_STAIRS_LEFT = [0, 0.5, 1, 1, 0.5, 0, 1, 0.5]
BlockShape.VERTICAL_THIN = [0.25, 0, 0.75, 1]
BlockShape.HORIZONTAL_THIN = [0, 0.25, 1, 0.75]
BlockShape.ONE_SHORT = [0, 0, 1, 15/16]
import { registerTypes } from "../modules/dataproto.js"

export const ENCH_COUNT = 3

export class EnchantmentList extends Uint8Array{
	constructor(){super(ENCH_COUNT)}
	level(ench){ return this[ench] }
	has(ench){ return this[ench] != 0 }
	add(ench, lvl = 1){
		const o = this[ench]
		this[ench] = lvl == o ? o+1 : max(lvl, o)
		return this
	}
	set(ench, lvl = 1){
		this[ench] = lvl
		return this
	}
	unset(ench){ this[ench] = 0 }
	clear(){ this.fill(0) }
	static decode(buf){
		const ench = new EnchantmentList()
		let l = buf.flint()
		while(l--){
			const n = buf.short()
			ench[n>>8] = n
		}
		return ench
	}
	static encode(buf, v){
		for(let i = 0; i < ENCH_COUNT; i++)
			if(v[i]) buf.short(i<<8|v[i])
	}
}

registerTypes({ EnchantmentList })

export const Enchantments = {
	silk_touch: 0,
	sharpness: 1,
	efficiency: 2
}
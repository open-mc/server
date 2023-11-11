import { Blocks } from '../../blocks/block.js'
import { stat } from '../../world/index.js'
import { Item } from '../../items/item.js'
import { cancelgridevent, goto, gridevent, peek, place } from '../../misc/ant.js'
import { ChunkLoader } from '../chunkloader.js'
import { Entities } from '../entity.js'
import { LivingEntity } from './living.js'

const STEVE = "缀\x7f罿缀\x7f孛缀\x7f罿缀\x7f罿缀\x7f罿缀\x7f罿⠰ひ爨Ωせ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0缀\x7f桨栀h罿栀h桨栀h罿缀\x7f桨栀h罿⠰♲嬡Ωせ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0栀h桨栀h罿缀\x7f桨栀h罿缀\x7f桨栀h罿⠰♲嬡⠰ひ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0嬀[桨栀h孛缀\x7f桨栀h罿缀\x7f桨栀h罿⠰♲嬡⠰ひ爨⠰ひ爨Ωせ爨\0\0\0\0\0\0\0\0\0\0\0\0栀h孛嬀[孛徖陁䅟徖蝁㭕徖陁䅟徖蝁㭕⠰♲嬡⠰ひ爨⠰♲嬡⠰ひ爨ᬨ⠊ਛᨦ✊ଛᰩ㈌ဣ\u202dⴐဠ嬀[孛嬀[桨徖陁䅟徖蝁㭕徖陁䅟喇阻䅟⠰♲嬡⠰ひ爨⠰♲嬡Ωせ爨ᬨ⠊ਛᨦ☊ਚḬ⤎జḫ㌍ᄤ栀h孛嬀[桨喇阻䅟徖蝁㭕徖陁䅟喇阻䅟⠰♲嬡⠰ひ爨⠰ひ爨Ωせ爨Ḭ☎ଘᨦ⤊జḫ⠎ଛᠤ⤊జ缀\x7f桨栀h罿喇阻䅟徖陁䅟喇阻䅟喇阻䅟⠰ひ爨⠰ひ爨⠰ひ爨Ωせ爨ᬨ⠊ചᴭⰎพᬨ✊ଛḬ⼎ᄢ缀\x7f桨栀h罿喇阻䅟喇阻䅟喇阻䅟徖陁䅟⠰ひ爨⠰ひ爨⠰ひ爨⠰ひ爨ᬨ⠊ਛᬨ☊చᜣ蜉㩘掜㩅ᐨ缀\x7f桨缀\x7f罿徖陁䅟喇阻䅟徖陁䅟徖陁䅟㼿㼿㼿⠰ひ爨㼿㼿㼿⠰ひ爨ᬨ⠊ਛᨨ☍ଘḬ萑ㅒ徖衁㥚⠰♲嬡⠰♲嬡徖陁䅟喇阻䅟徖蝁㭕徖蝁㭕㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿Ḭ⠎ਛᴭ戎⽃檝驏䑣历甴⽇⠰♲嬡⠰ひ爨徖陁䅟徖陁䅟徖陁䅟徖蝁㭕㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿㼿历蘴㑓掚虄㑓果陈䅟妊琻⽈"
const defaultSkin = new Uint8Array(1008)
for(let i = 0; i < 1008; i+=2)defaultSkin[i]=STEVE.charCodeAt(i>>1),defaultSkin[i+1]=STEVE.charCodeAt(i>>1)>>8

Entities.player = class Player extends ChunkLoader(LivingEntity){
	inv = Array.null(37)
	items = [null, null, null, null, null]
	static interfaceList = [0, 1]
	interface(id){return id == 0 ? this.inv : id == 1 ? this.items : undefined}
	selected = 0
	skin = defaultSkin
	breakGridEvent = 0
	blockBreakLeft = -1
	bx = 0; by = 0
	rubberMv = 0
	static width = 0.3
	get height(){return this.state & 2 ? 1.5 : 1.8}
	get head(){return this.state & 2 ? 1.4 : 1.6}
	toString(){
		return `\x1b[33m${this.name}\x1b[m \x1b[31m${this.health/2} ♥\x1b[m`
	}
	update(){
		super.update()
		if(this.blockBreakLeft >= 0 && --this.blockBreakLeft == -1){
			goto(this.world, this.bx, this.by)
			const tile = peek()
			gridevent(2)
			place(tile.behind ?? Blocks.air)
			const drop = tile.drops?.(this.inv[this.selected])
			if(drop instanceof Item){
				const itm = new Entities.item()
				itm.item = drop
				itm.dx = random() * 6 - 3
				itm.dy = 6
				itm.place(this.world, this.bx + 0.5, this.by + 0.375)
			}else if(drop instanceof Array){
				for(const d of drop){
					if(!d) continue
					const itm = new Entities.item()
					itm.item = d
					itm.dx = random() * 6 - 3
					itm.dy = 6
					itm.place(this.world, this.bx + 0.5, this.by + 0.375)
				}
			}
			stat('player', 'blocks_broken')
			cancelgridevent(this.breakGridEvent)
			this.breakGridEvent = 0
		}
	}
	static savedata = {
		health: Byte,
		inv: [Item, 37],
		items: [Item, 5],
		selected: Byte,
		skin: Uint8Array
	}
	_avatar = null
	getAvatar(){
		if(this._avatar) return this._avatar
		src = this.skin; dest = new Int32Array(4096)
		// draw shoulder at x=22, y=49 (to x=42, y=64)
		c3t4_5(3158, 4); c3t4_5(3163, 5); c3t4_5(3168, 6); c3t4_5(3173, 7)
		c3t4_5(3478,32); c3t4_5(3483,33); c3t4_5(3488,34); c3t4_5(3493,35)
		c3t4_5(3798,60); c3t4_5(3803,61); c3t4_5(3808,62); c3t4_5(3813,63)
		// draw head at x=12, y=9
		for(let i = 0; i < 64; i++)
			c3t4_5(588 + (i&7)*5 + (i>>3)*320, 132 + (i&7) + (i>>3)*28)
		// Free echo back service because discord is dumb and doesn't allow data avatar urls
		this._avatar = PNG.write(dest, 64, 64)
		this._avatar.then(a=>this._avatar=a)
		return this._avatar
	}
	getName(){ return this.name }
}
let src, dest
// Function for copying 3 bytes from an rgb u8 image buffer to a 5x5 area in an rgba u32 image buffer
const c3t4_5 = new Uint8Array(Uint16Array.of(1).buffer)[0] === 1
? (p, o) => {
	dest[p    ] = dest[p + 1] = dest[p + 2] = dest[p + 3] = dest[p + 4] =
	dest[p +64] = dest[p +65] = dest[p +66] = dest[p +67] = dest[p +68] =
	dest[p+128] = dest[p+129] = dest[p+130] = dest[p+131] = dest[p+132] =
	dest[p+192] = dest[p+193] = dest[p+194] = dest[p+195] = dest[p+196] =
	dest[p+256] = dest[p+257] = dest[p+258] = dest[p+259] = dest[p+260] =
		src[o*=3] | src[o+1] << 8 | src[o+2] << 16 | 0xFF000000
}
: (p, o) => {
	dest[p    ] = dest[p + 1] = dest[p + 2] = dest[p + 3] = dest[p + 4] =
	dest[p +64] = dest[p +65] = dest[p +66] = dest[p +67] = dest[p +68] =
	dest[p+128] = dest[p+129] = dest[p+130] = dest[p+131] = dest[p+132] =
	dest[p+192] = dest[p+193] = dest[p+194] = dest[p+195] = dest[p+196] =
	dest[p+256] = dest[p+257] = dest[p+258] = dest[p+259] = dest[p+260] =
		src[o*=3] << 16 | src[o+1] << 8 | src[o+2] | 255
}
export class Item{
	constructor(count = 1){
		this.count = count
		this.name = ''
	}
	[Symbol.for('nodejs.util.inspect.custom')](){ return 'Items.'+this.className+'(\x1b[33m'+this.count+'\x1b[m)' }
	static savedatahistory = []
	static savedata = null
	static id = -1
	static burns = false
	place(){
		return Blocks[this.className] || null
	}
}
Object.setPrototypeOf(Item.prototype, null)
export const Items = Object.create(null)
export const ItemIDs = []
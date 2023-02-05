export class Block{
	[Symbol.for('nodejs.util.inspect.custom')](){ return `Blocks.${this.className}${this.savedata ? ' {...}' : ''}` }
	static id = -1
	static name = ''
	static flammability = 0
	static breaktime = 1
	static blast = 3
	static solid = true
	static tool = ''
	static savedata = null
	static savedatahistory = []
	drops(){ return null }
}
Object.setPrototypeOf(Block.prototype, null)
export const Blocks = Object.create(null)
export const BlockIDs = []
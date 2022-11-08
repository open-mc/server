const util = {
	inspect: a => a
}
util.inspect.custom = Symbol.toPrimitive

export {util}
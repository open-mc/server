export default {
	name: "", id: -1,
	burns: false,
	place(){
		return Blocks[this._.name] || null
	}
}
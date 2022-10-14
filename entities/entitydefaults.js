export default {
	id: -1, name: "",
	maxhealth: 20,
	died(){
		this.chunk && this.chunk.entities.delete(this)
	},
	moved(oldx, oldy, oldw){},
	rubber(){},
	_savedatahistory: [],
	_savedata: null
}
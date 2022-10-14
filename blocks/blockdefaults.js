import { Items } from "../items/item.js";

export default {
	id: -1, name: "",
	flammability: 0,
	breaktime: 1,
	blast: 3,
	drops(){
		return Items[this._.name] ? [Items[this._.name](1)] : []
	},
	solid: true,
	tool: '',
	_savedatahistory: [],
	_savedata: null
}
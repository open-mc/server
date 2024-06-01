import { Item, Items } from '../item.js'

Items.lapis = class Lapis extends Item{ //literally does nothing

}
Items.gold = class Gold extends Item{

}
Items.coal = class Coal extends Item{
	static canSmelt = 8
}
Items.iron = class Iron extends Item{

}
Items.emerald = class Emerald extends Item{

}
Items.diamond = class Diamond extends Item{

}
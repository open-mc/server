import { Item, Items } from '../item.js'

Items.lapis = Item.define() //literally does nothing
Items.gold = Item.define()
Items.coal = Item.define({burns: true})
Items.iron = Item.define()
Items.emerald = Item.define()
Items.diamond = Item.define()
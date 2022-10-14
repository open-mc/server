import { Item, Items } from "../item.js"

const SANDSTONE = {
	
}

Items.sandstone = new Item({...SANDSTONE})
Items.cut_sandstone = new Item({...SANDSTONE})
Items.smooth_sandstone = new Item({...SANDSTONE, blast: 6, breaktime: 10}) //smooth is harder
Items.chiseled_sandstone = new Item({...SANDSTONE})
Items.red_sandstone = new Item({...SANDSTONE})
Items.cut_red_sandstone = new Item({...SANDSTONE})
Items.chiseled_red_sandstone = new Item({...SANDSTONE})
Items.smooth_red_sandstone = new Item({...SANDSTONE, blast: 6, breaktime: 10}) //smooth is harder
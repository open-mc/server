import { Item, Items } from '../item.js'

const SANDSTONE = {
	
}

Items.sandstone = Item.define({...SANDSTONE})
Items.cut_sandstone = Item.define({...SANDSTONE})
Items.smooth_sandstone = Item.define({...SANDSTONE, blast: 6, breaktime: 10}) //smooth is harder
Items.chiseled_sandstone = Item.define({...SANDSTONE})
Items.red_sandstone = Item.define({...SANDSTONE})
Items.cut_red_sandstone = Item.define({...SANDSTONE})
Items.chiseled_red_sandstone = Item.define({...SANDSTONE})
Items.smooth_red_sandstone = Item.define({...SANDSTONE, blast: 6, breaktime: 10}) //smooth is harder
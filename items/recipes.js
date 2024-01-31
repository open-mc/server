import { Items } from "./item.js"
import { createShaped1x2Recipe, createShapelessRecipe } from "../misc/crafting.js"

createShapelessRecipe([Items.oak_log], Items.oak_planks, 4)
createShaped1x2Recipe([Items.oak_planks, Items.oak_planks], Items.stick, 4)
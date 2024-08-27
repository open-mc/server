import { Items } from "./item.js"
import { createShaped1x2Recipe, createShaped2x2Recipe, createShaped3x3Recipe, createShapelessRecipe, createSmeltRecipe } from "../misc/crafting.js"

createShapelessRecipe([Items.oak_log], Items.oak_planks, 4)
createShaped1x2Recipe([Items.oak_planks, Items.oak_planks], Items.stick, 4)
createShaped2x2Recipe([Items.oak_planks, Items.oak_planks, Items.oak_planks, Items.oak_planks], Items.crafting_table, 1)
createShaped3x3Recipe([Items.oak_planks, Items.oak_planks, Items.oak_planks, Items.oak_planks, null, Items.oak_planks, Items.oak_planks, Items.oak_planks, Items.oak_planks], Items.chest, 1)
createShaped3x3Recipe([Items.cobblestone, Items.cobblestone, Items.cobblestone, Items.cobblestone, null, Items.cobblestone, Items.cobblestone, Items.cobblestone, Items.cobblestone], Items.furnace, 1)
createShaped1x2Recipe([Items.stick, Items.coal], Items.torch, 4)

createSmeltRecipe(Items.cobblestone, Items.stone)
createSmeltRecipe(Items.sand, Items.glass)
createSmeltRecipe(Items.oak_log, Items.coal)
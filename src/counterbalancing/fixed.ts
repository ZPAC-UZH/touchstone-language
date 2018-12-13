import {TSLTrialTable, TSLBlock} from "../tsl_types";
import {TSLStrategyRegistry} from "./registry";
import {extractLevelsOfVariables} from "../variables/variables"

import { fixedOrderGenerator } from "../worker";

function generator(block: TSLBlock, pCount: number): TSLTrialTable {
    return fixedOrderGenerator(
        extractLevelsOfVariables(block.variables),
        pCount,
        block.replication,
        block.serial);
}

export const CB_FIX: string = 'fix';

TSLStrategyRegistry.sharedRegistry().addGeneratorForStrategy(CB_FIX, generator);

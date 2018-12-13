import {TSLTrialTable, TSLBlock} from "../tsl_types";
import {TSLStrategyRegistry} from "./registry";
import {extractLevelsOfVariables} from "../variables/variables"

import { latinSquareGenerator } from "../worker";

function generator(block: TSLBlock, pCount: number): TSLTrialTable {
    return latinSquareGenerator(
        extractLevelsOfVariables(block.variables),
        pCount,
        block.replication,
        block.serial);
}

export const CB_LATIN: string = 'latin';

TSLStrategyRegistry.sharedRegistry().addGeneratorForStrategy(CB_LATIN, generator);

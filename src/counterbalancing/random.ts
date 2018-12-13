import {TSLTrialTable, TSLBlock} from "../tsl_types";
import {TSLStrategyRegistry} from "./registry";
import {extractLevelsOfVariables} from "../variables/variables"

import { allRandomGenerator } from "../worker";

function generator(block: TSLBlock, pCount: number): TSLTrialTable {
    return allRandomGenerator(
        extractLevelsOfVariables(block.variables),
        pCount,
        block.replication,
        block.serial);
}

export const CB_RANDOM: string = 'random';

TSLStrategyRegistry.sharedRegistry().addGeneratorForStrategy(CB_RANDOM, generator);

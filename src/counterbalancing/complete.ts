import {TSLTrialTable, TSLBlock} from "../tsl_types";
import {TSLStrategyRegistry} from "./registry";
import {extractLevelsOfVariables} from "../variables/variables"

import { completeGenerator } from "../worker";

function generator(block: TSLBlock, pCount: number): TSLTrialTable {
    return completeGenerator(
        extractLevelsOfVariables(block.variables),
        pCount,
        block.replication);
}

export const CB_COMPLETE: string = 'complete';

TSLStrategyRegistry.sharedRegistry().addGeneratorForStrategy(CB_COMPLETE, generator);

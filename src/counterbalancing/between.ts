import {TSLTrialTable, TSLBlock} from "../tsl_types";
import {TSLStrategyRegistry} from "./registry";
import {extractLevelsOfVariables} from "../variables/variables"

import { cartesian, fixedOrderGenerator } from "../worker";


function generator(block: TSLBlock, pCount: number): TSLTrialTable {
    const levels = extractLevelsOfVariables(block.variables);
    let permutations = cartesian(levels);
    // TODO: replace cartesian with js-combinatorics
    // import { cartesianProduct } from "js-combinatorics";
    // let permutations = cartesianProduct(levels).toArray()

    let permIdx = 0;
    let tblParticipants: TSLTrialTable = [];
    for (let partIdx = 0; partIdx < pCount; partIdx++) {

        // one trial consist of a permutation row of all conditions
        const conditions =  permutations[permIdx];

        // repeat the trials according to the replications
        let trials: string[][] = [];
        for (let i = 0; i < block.replication; i++) {
            trials.push(conditions);
        }

        // all trials of this participant
        tblParticipants.push(trials);

        // reuse the permutations
        permIdx = (permIdx + 1) % permutations.length;
    }

    // NOTE: serial is not meaningful here because all trials are the same

    return tblParticipants;
}

export const CB_BETWEEN: string = 'between';

TSLStrategyRegistry.sharedRegistry().addGeneratorForStrategy(CB_BETWEEN, generator);

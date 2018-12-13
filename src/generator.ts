import * as _ from "lodash";
import { combination } from "js-combinatorics";

import {TSLBlock, TSLNode, TSLTrialTable, TSLGeneratorFunction, TSLOperator, isTSLOperator} from "./tsl_types"
import {TSLStrategyRegistry} from "./counterbalancing";

type TableOrUndefined = TSLTrialTable | undefined;

export function trialTableFromTSLNode(node: TSLNode, numberOfParticipants: number): TableOrUndefined {
    if (node == undefined) {
        return undefined;
    } else if (isTSLOperator(node)) {
        return trialTableFromTSLOperator(<TSLOperator>node, numberOfParticipants);
    } else {
        return trialTableFromTSLBlock(<TSLBlock>node, numberOfParticipants);
    }
}

function trialTableFromTSLOperator(node: TSLOperator, numberOfParticipants: number): TableOrUndefined {
    let trialTable : TSLTrialTable;

    // TODO: handle block-crossing
    // TODO: handle condition-order placeholders in block-crossing

    return trialTable;
}

function trialTableFromTSLBlock(block: TSLBlock, numberOfParticipants: number): TableOrUndefined {

    const generate: TSLGeneratorFunction = TSLStrategyRegistry.sharedRegistry().generatorForStrategy(block.strategy);
    let trialTable = generate(block, numberOfParticipants);

    const subTrialTable = trialTableFromTSLNode(block.subBlock, numberOfParticipants);
    trialTable = mergeNestedTrialTables(trialTable, subTrialTable);

    return trialTable;
}


function mergeNestedTrialTables(parentTable: TableOrUndefined, childTable: TableOrUndefined): TableOrUndefined {

    // NOTE: code extracted from designToTrialTable in worker.js and slightly modified

    if (parentTable == undefined) {
        return childTable;
    } else if (childTable == undefined) {
        return parentTable;
    }

    let combinedTrialTable : TSLTrialTable = [];

    for (let pid = 0; pid < parentTable.length; pid++) {
        let tpParent = parentTable[pid];   // tp: Trial table for one participant
        let tpChild = childTable[pid];
        let tpCombined = [];
        for (let iParent = 0; iParent < tpParent.length; iParent++) {
            for (let iChild = 0; iChild < tpChild.length; iChild++) {
                let trialParent = tpParent[iParent];
                let trialChild = tpChild[iChild];
                let trialCombined = trialParent.concat(trialChild);
                tpCombined.push(trialCombined);
            }
        }
        combinedTrialTable.push(tpCombined);
    }
    return combinedTrialTable;

}



// TODO: handle multi-session output (new session-enabled trial table is needed)
// TODO: Check how to handle the randomization in the multi-session output

// TODO: plug TSL back to Touchstone to test with the UI (see createTable function for the new session-enabled trial table

// TODO: Lint: Convert snake case to camel case
// TODO: Lint: Standardize quotation marks


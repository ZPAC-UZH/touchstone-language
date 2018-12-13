
// Trial table is a three-level nested array of participants, trials, levels (same as those defined in worker.js)
export type TSLTrialTable = Array<Array<Array<string>>>;


/**
 * Generate trial table from the current level of the experimental design block
 * @param {TSLBlock} block experimental design block
 * @param {number} pCount number of participants
 * @return {TSLTrialTable} trial table generated from the given design
 */
export type TSLGeneratorFunction = (block: TSLBlock, pCount: number) => TSLTrialTable;


export interface TSLVariable {
    name: string,
    levels: string[]
}

export interface TSLBlock {
    strategy: string,
    serial: boolean,
    replication: number,
    variables: TSLVariable[],
    subBlock?: TSLBlock
}

export interface TSLOperator {
    operator: string,
    operands: TSLBlock[]
}

export type TSLNode = (TSLBlock | TSLOperator);

export function isTSLOperator(node: TSLBlock | TSLOperator): node is TSLOperator {
    return (<TSLOperator>node).operator !== undefined;
}
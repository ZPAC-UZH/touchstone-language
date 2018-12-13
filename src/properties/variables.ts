import {TSLBlock} from "../tsl_types";

export function extractVariables(node: TSLBlock) {
  let variables: any[] = [];
  let currentBlock: TSLBlock = node;
  let hasSubBlock: boolean = true;
  while (hasSubBlock) {
    variables.push(currentBlock.variables);
    if (currentBlock.hasOwnProperty('subBlock')) {
      currentBlock = currentBlock.subBlock;
    } else {
      hasSubBlock = false;
    }
  }
  return variables;
}

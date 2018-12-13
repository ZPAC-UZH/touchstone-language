import {TSLVariable} from "../tsl_types";

export function extractLevelsOfVariables(ivs: TSLVariable[]): string[][] {
    const allLevels = [];
    for (let iv of ivs) {
        allLevels.push(iv.levels);
    }
    return allLevels;
}
import * as fs from "fs";
import { parse } from "./run_parser";
import {trialTableFromTSLNode} from "./generator";
import { pretty_str } from "./util";
import {calculateMultipleParticipants} from "./properties/minParticipants";
import {extractVariables} from "./properties/variables";


/**
 * generate trial table from TSL input
 * @param tsl_input TSL string
 * @param pCount number of participants
 */
export function generate_tsl (tsl_input: string, pCount: number) {
    let ast = parse(tsl_input);
    return generate_ast(ast, pCount);
}

/**
 *
 * @param tsl_input {string} Experiment design as TSL
 * @param pCount {number} Number of participants
 * @typedef {Object} TslWithMeta
 * @property {TSLTrialTable} trialTable
 * @property {number} multiplePCount The multiple number of participants needed for a correctly counterbalanced design
 * @property {Array.TSLVariable} variables All independent variables for the whole design
 */
export function generateTslWithMeta(tsl_input: string, pCount: number) {
  let sessions = parse(tsl_input);
  let multiple: number = calculateMultipleParticipants(sessions[0].design);
  const variables = extractVariables(sessions[0].design);
  let trialTable = generate_ast(sessions, pCount);
  return {
    trialTable,
    multiplePCount: multiple,
    variables,
  };
}

/**
 * generate trial table from abstract syntax tree of TSL
 * @param tsl_input abstract syntax tree of TSL (see example by running the run_parser.js
 * @param pCount number of participants
 */
export function generate_ast (ast_input: object, pCount: number) {
    let sessions = ast_input;
    let trialTable = trialTableFromTSLNode(sessions[0].design, pCount);
    return trialTable;
}


// if called from commandline, parse argument and compile
if (require.main === module) {

    let args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("Usage: node generate.js <numberOfParticipants> <TSL path>\n" +
            "Example: node generate.js 6 test/testcases/complete.tsl")
        process.exit(-1);
    }

    if (args.length > 0) {
        let pCount = Number(args[0]);
        let tsl_path = args[1];
        let tsl_input = fs.readFileSync(tsl_path, "utf8");
        console.log(pretty_str(generate_tsl(tsl_input, pCount)));
    }
}

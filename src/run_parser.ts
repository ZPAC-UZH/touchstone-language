import * as fs from "fs";
import { pretty_str } from "./util";
const parser = require('./parserTSL.js')

// adapter function from the TSL object
export function parse (tsl_input) {
    return parser.parse(tsl_input);
}

// if called from commandline, parse argument and compile
if (require.main === module) {
    let input_path = "test/testcases/one_iv.tsl";
    let args = process.argv.slice(2);
    if (args.length > 0) {
        input_path = args[0];
    }
    if (args.length > 0) {
        let tsl_input = fs.readFileSync(input_path, "utf8");
        let result = parse(tsl_input);
        console.log(pretty_str(result));
    }
}

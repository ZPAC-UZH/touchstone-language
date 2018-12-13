import 'mocha';
import { expect } from "chai";

import * as fs from "fs";

import * as _ from "lodash";

// from TSL
import { TSLTrialTable } from "../src/tsl_types";
import { parse } from "../src/run_parser";
import { trialTableFromTSLNode } from "../src/generator";

// from code in Touchstone 2
import { designToTrialTable as TS2designToTrialTable } from "../src/worker";  // from Touchstone 2 UI code

describe("Condition order placeholder", function () {
    let tsl_input = fs.readFileSync("test/testcases/placeholder.tsl", "utf8");
    let sessions = parse(tsl_input);

    let design = sessions[0].design;

    it("should insert conditions accordingly", function () {
        // TODO: check the condition order resolution from the input file above
    });
});


function loadAndTestJSONAndTSL (testCaseName : string) {

    let jsonInput = JSON.parse(fs.readFileSync(`test/testcases/json/${testCaseName}.json`, "utf8"));
    let p = jsonInput.participants;

    // reference output from the export from Touchstone 2 UI
    let tableByUI = jsonInput.trialTable;

    // re-running Touchstone 2 code
    let tableByRerun = TS2designToTrialTable(jsonInput).trialTable;

    // TSL
    let tslInput = fs.readFileSync(`test/testcases/${testCaseName}.tsl`, "utf8");
    let sessions = parse(tslInput);
    let tableByTSL = trialTableFromTSLNode(sessions[0].design, p);

    return [tableByUI ,tableByRerun, tableByTSL];
}

function trialTableColumn(trialTable: TSLTrialTable, pid: number, col: number): string[] {
    let retColumn: string[] = [];
    let participant = trialTable[pid];
    for (let trial of participant) {
        retColumn.push(trial[col]);
    }
    return retColumn;
}

describe("Complete, one IV", function() {

    let [tableByUI, tableByRerun, tableByTSL] = loadAndTestJSONAndTSL("complete");

    it('should produce equivalent trial table', function () {
        expect(tableByRerun).to.deep.equal(tableByTSL);
    });

    it('should match the output from the Touchstone 2 UI', function () {
        expect(tableByUI).to.deep.equal(tableByTSL);
    });
});

describe('Complete, too many levels', () => {
  const tslInput = fs.readFileSync("test/testcases/complete_too_large.tsl", "utf8");
  it('should throw an error that the block has too many levels', () => {
    let sessions = parse(tslInput);
    expect(() => trialTableFromTSLNode(sessions[0].design, 1)).to.throw('Block has too many conditions for Complete counterbalancing');
  });
});

describe("Latin-square, one IV", function() {

    let [tableByUI, tableByRerun, tableByTSL] = loadAndTestJSONAndTSL("one_iv");

    it('should produce equivalent trial table', function () {
        expect(tableByRerun).to.deep.equal(tableByTSL);
    });

    it('should match the output from the Touchstone 2 UI', function () {
        expect(tableByUI).to.deep.equal(tableByTSL);
    });
});

describe("Latin-square, two IVs", function() {

    let [tableByUI, tableByRerun, tableByTSL] = loadAndTestJSONAndTSL("cross_variables");

    it('should produce equivalent trial table', function () {
        expect(tableByRerun).to.deep.equal(tableByTSL);
    });

    it('should match the output from the Touchstone 2 UI', function () {
        expect(tableByUI).to.deep.equal(tableByTSL);
    });
});


describe("Nested, two-levels", function() {

    let [tableByUI, tableByRerun, tableByTSL] = loadAndTestJSONAndTSL("nest_two_levels");

    it('should produce equivalent trial table', function () {
        expect(tableByRerun).to.deep.equal(tableByTSL);
    });

    it('should match the output from the Touchstone 2 UI', function () {
        expect(tableByUI).to.deep.equal(tableByTSL);
    });
});

describe("Serial", function() {

    let [tableByUI, tableByRerun, tableByTSL] = loadAndTestJSONAndTSL("serial");

    it('should produce equivalent trial table', function () {
        expect(tableByRerun).to.deep.equal(tableByTSL);
    });

    it('should match the output from the Touchstone 2 UI', function () {
        expect(tableByUI).to.deep.equal(tableByTSL);
    });
});


describe("Between-subjects, one IV", function() {

    let sessions = parse("< Between(Device = {M, T}, 1) >");
    let pCount = 4;
    let tableByTSL = trialTableFromTSLNode(sessions[0].design, pCount);

    it('should produce one trial per participant', function () {
        expect(tableByTSL ).to.deep.equal(
            [ [ [ "M"] ],  // P1
                [ [ "T"] ],  // P2
                [ [ "M"] ],  // P3
                [ [ "T"] ],  // P4
            ]
        );
    });
});


describe("Between-subjects, cross IV", function() {

    let tslInput = fs.readFileSync(`test/testcases/between_cross_variables.tsl`, "utf8");
    let sessions = parse(tslInput);

    it('should cross variables in the trial table', function () {
        let tableByTSL = trialTableFromTSLNode(sessions[0].design, 6);

        expect(tableByTSL ).to.deep.equal(
            [ [ [ "M", "1"] ],  // P1
                [ [ "M", "2"] ],  // P2
                [ [ "M", "3"] ],  // P3
                [ [ "T", "1"] ],  // P4
                [ [ "T", "2"] ],  // P5
                [ [ "T", "3"] ],  // P6
            ]
        );
    });

    it('should reuse the rows when participant number exceed permutations', function () {
        let tableByTSL = trialTableFromTSLNode(sessions[0].design, 8);

        expect(tableByTSL ).to.deep.equal(
            [ [ [ "M", "1"] ],  // P1
                [ [ "M", "2"] ],  // P2
                [ [ "M", "3"] ],  // P3
                [ [ "T", "1"] ],  // P4
                [ [ "T", "2"] ],  // P5
                [ [ "T", "3"] ],  // P6
                [ [ "M", "1"] ],  // P7
                [ [ "M", "2"] ],  // P8
            ]
        );
    });

});


describe("Mixed design: between- and within-subjects", function() {

    let tslInput = fs.readFileSync(`test/testcases/between_within.tsl`, "utf8");
    let sessions = parse(tslInput);
    let tableByTSL = trialTableFromTSLNode(sessions[0].design, 6);

    for (let pid = 0; pid < tableByTSL.length; pid++) {
        it('should give the expected number of trials per participant', function () {
            expect(tableByTSL[pid]).to.have.lengthOf(3);
        });

        it('each participant should have one between-subjects level', function () {
            expect(_.uniq(trialTableColumn(tableByTSL, pid, 0))).to.have.lengthOf(1);
        });

        it('each participant should have three within-subjects level', function () {
            expect(_.uniq(trialTableColumn(tableByTSL, pid, 1))).to.have.lengthOf(3);
        });
    };

});

describe("Between-subjects with replication", function() {

    let tslInput = fs.readFileSync(`test/testcases/between_replication.tsl`, "utf8");
    let sessions = parse(tslInput);
    let tableByTSL = trialTableFromTSLNode(sessions[0].design, 2);


    it('should give the expected number of trials per participant', function () {
        expect(tableByTSL[0]).to.have.lengthOf(4);
        expect(tableByTSL[1]).to.have.lengthOf(4);
    });

    it('should give the expected conditions', function () {
        expect(_.uniq(trialTableColumn(tableByTSL, 0, 0))).to.deep.equal(["M"]);
        expect(_.uniq(trialTableColumn(tableByTSL, 1, 0))).to.deep.equal(["T"]);
    });

});


describe("Nested: single replication", function() {

    let tslInput = fs.readFileSync(`test/testcases/nest_single_rep.tsl`, "utf8");
    let sessions = parse(tslInput);
    let tableByTSL = trialTableFromTSLNode(sessions[0].design, 6);


    it("columns should contain all levels", function () {
        expect(_.uniq(trialTableColumn(tableByTSL, 0, 0))).to.have.members(["M", "T", "J"]);
        expect(_.uniq(trialTableColumn(tableByTSL, 0, 1))).to.have.members(["2", "3"]);
    });

    it("the second column should draw different orders", function () {
        let p0 = tableByTSL[0];
        for (let i of [1, 2]) { // [1, 2] is from three conditions M, T, J; start iteration from the second condition

            const j = (2 * i);      // 2 is from two conditions 2, 3
            const jPrev = 2 * (i - 1);

            const prev2ndCol    = [p0[jPrev][1], p0[jPrev + 1][1], p0[jPrev + 2][1]];
            const current2ndCol = [p0[j][1],     p0[j + 1][1],     p0[j + 2][1]];
            expect(prev2ndCol).to.not.deep.equal(current2ndCol);
        }
    });

});

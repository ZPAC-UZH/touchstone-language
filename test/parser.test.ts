let expect = require("chai").expect;
let fs = require("fs");
let parser = require("../src/run_parser.js");
let parse = parser.parse;

describe("Single-variable design", function () {

  let tsl_input = fs.readFileSync("test/testcases/one_iv.tsl", "utf8");
  let sessions = parse(tsl_input);

  it("should have one session", function () {
    expect(sessions).to.be.a("array");
    expect(sessions).to.have.lengthOf(1);
  });

  let session = sessions[0];
  it("should have correct experiment structure", function () {
    expect(session).to.be.a("object");
    expect(session).to.have.property("name");
    expect(session).to.have.property("repetition");
    expect(session).to.have.property("design");
  });

  let design = session.design;
  it("should have correct design structure", function () {
    expect(design).to.be.a("object");
    expect(design).to.have.property("strategy");
    expect(design).to.have.property("serial");
    expect(design).to.have.property("variables");
    expect(design).to.have.property("replication");
  });

  it("should have correct serial setting", function () {
    expect(design.serial).to.be.false;
  });

  let variables = design.variables;
  it("should have correct variable array", function () {
    expect(variables).to.be.a("array");
    expect(variables).to.have.lengthOf(1);
  });

  let variable = variables[0];
  it("should have correct variable structure", function () {
    expect(variable).to.be.a("object");
    expect(variable).to.have.property("name");
    expect(variable).to.have.property("levels");
  });

  let levels = variable.levels;
  it("should have correct variable levels", function () {
    expect(levels).to.be.a("array");
    expect(levels).to.have.members(["M", "T", "J"]);
  });  
});


describe("Multi-session design", function () {
  let tsl_input = fs.readFileSync("test/testcases/multisession.tsl", "utf8");
  let sessions = parse(tsl_input);

  it("should concatenate correctly", function () {
    expect(sessions).to.be.a("array");
    expect(sessions).to.have.lengthOf(2);
  });


  it("should have correct number of repetitions", function () {
    expect(sessions[0].repetition).to.equal(1);
    expect(sessions[1].repetition).to.equal(10);
  });

  it("should have correct name", function () {
    expect(sessions[0].name).to.equal("Training");
  });
});



describe("Nested design", function () {
  let tsl_input = fs.readFileSync("test/testcases/nest_two_levels.tsl", "utf8");
  let sessions = parse(tsl_input);

  it("should have correct nesting", function () {
    expect(sessions).to.be.a("array");
    expect(sessions).to.have.lengthOf(1);
    expect(sessions[0].design.strategy).to.equal("latin");
    expect(sessions[0].design.variables).to.deep.include.members([{ name: "Device", levels: [ "M", "T", "J"]}]);
    expect(sessions[0].design.subBlock.strategy).to.equal("latin");
    expect(sessions[0].design.subBlock.variables).to.deep.include.members([{ name: "ID", levels: [ "2", "3", "5", "6"]}]);
  });
});


describe("Serial design", function () {

  let tsl_input = fs.readFileSync("test/testcases/serial.tsl", "utf8");
  let sessions = parse(tsl_input);

  let design = sessions[0].design;
  it("should have correct serial setting", function () {
    expect(design.serial).to.be.false;
    expect(design.subBlock.serial).to.be.true;
  });

});


describe("Same placeholder: session", function () {
  let tsl_input = fs.readFileSync("test/testcases/same_session.tsl", "utf8");
  let sessions = parse(tsl_input);

  it("should have same experimental design", function () {
    expect(sessions[1].design).to.deep.equal(sessions[0].design);
    expect(sessions[2].design).to.deep.equal(sessions[0].design);
  });
});


describe("Crossing variables", function () {
  let tsl_input = fs.readFileSync("test/testcases/cross_variables.tsl", "utf8");
  let sessions = parse(tsl_input);

  let variables = sessions[0].design.variables;
  it("should be combined an array of variables", function () {
    expect(variables).to.be.a("array");
    expect(variables).to.have.lengthOf(2);
    expect(variables[0].name).to.equal("Device");
    expect(variables[1].name).to.equal("ID");
  });

  it("should have two variables", function () {
    expect(variables).to.be.a("array");
    expect(variables).to.have.lengthOf(2);
  });

  it("should have correct variable levels", function () {
    expect(variables).to.deep.include.members([{ name: "Device", levels: [ "M", "T", "J"]}]);
    expect(variables).to.deep.include.members([{ name: "ID", levels: [ "2", "3", "5", "6"]}]);

  });
});


describe("Crossing two blocks (flatten)", function () {
  let tsl_input = fs.readFileSync("test/testcases/cross_blocks.tsl", "utf8");
  let sessions = parse(tsl_input);

  let design = sessions[0].design;
  it("should be saved as operator", function () {
    expect(design).to.be.a("object");
    expect(design.operator).to.equal("cross");
    expect(design).to.have.property("operands");
  });

  let left = design.operands[0];
  let right = design.operands[1];
  it("should keep both designs", function () {
    expect(left.variables).to.deep.have.members([{ name: "Device", levels: ["M", "T", "J"]}]);
    expect(right.variables).to.deep.have.members([{ name: "Device", levels: ["P", "R"]}]);

    expect(left.subBlock.variables).to.deep.have.members([{ name: "ID", levels: ["2", "3", "5", "6"]}]);
    expect(right.subBlock.variables).to.deep.have.members([{ name: "ID", levels: ["2", "3", "4"]}]);
  });
});


describe("Crossing multiple blocks", function () {
  let tsl_input = fs.readFileSync("test/testcases/cross_blocks_multiple.tsl", "utf8");
  let sessions = parse(tsl_input);

  let design = sessions[0].design;
  it("should flatten the block hierarchy", function () {
    expect(design.operands).to.have.lengthOf(3);
  });

  let block_1 = design.operands[0];
  let block_2 = design.operands[1];
  let block_3 = design.operands[2];
  it("should keep all three designs in-order", function () {
    expect(block_1.variables).to.deep.have.members([{ name: "Device", levels: ["M", "T", "J"]}]);
    expect(block_1.subBlock.variables).to.deep.have.members([{ name: "ID", levels: ["2", "3", "5", "6"]}]);

    expect(block_2.variables).to.deep.have.members([{ name: "Device", levels: ["P", "R"]}]);
    expect(block_2.subBlock.variables).to.deep.have.members([{ name: "ID", levels: ["2", "3", "4"]}]);

    expect(block_3.variables).to.deep.have.members([{ name: "Device", levels: ["S", "G"]}]);
    expect(block_3.subBlock.variables).to.deep.have.members([{ name: "ID", levels: ["2", "3", "4"]}]);
  });
});


describe("Same placeholder: design crossing", function () {
  let tsl_input = fs.readFileSync("test/testcases/same_design.tsl", "utf8");
  let sessions = parse(tsl_input);

  let design = sessions[0].design;
  let left = design.operands[0];
  let right = design.operands[1];

  it("should expand 'Same' in the RHS of the cross", function () {
    expect(left.subBlock).to.deep.equal(right.subBlock);
  });

});


describe("Same placeholder: multiple times at the same level", function () {
  let tsl_input = fs.readFileSync("test/testcases/same_design_multiple.tsl", "utf8");
  let sessions = parse(tsl_input);

  let cross = sessions[0].design;
  let design_1 = cross.operands[0];
  let design_2 = cross.operands[1];
  let design_3 = cross.operands[2];

  it("should expand 'Same' in the RHS of the cross", function () {
    expect(design_1.subBlock).to.deep.equal(design_2.subBlock);
    expect(design_2.subBlock).to.deep.equal(design_3.subBlock);
  });

});


describe("Same placeholder: multiple times at different level", function () {
  let tsl_input = fs.readFileSync("test/testcases/same_design_multilevel.tsl", "utf8");
  let sessions = parse(tsl_input);

  let cross = sessions[0].design;
  let design_1 = cross.operands[0];
  let design_2 = cross.operands[1];
  let design_3 = cross.operands[2];

  it("should expand 'Same' in the RHS of the cross", function () {
    expect(design_1.subBlock).to.deep.equal(design_2.subBlock);
    expect(design_2.subBlock.subBlock).to.deep.equal(design_3.subBlock.subBlock);
  });

});

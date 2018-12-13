# Touchstone Language (TSL)

TSL is a language for describing experimental design.
The parser (dynamically generated from `parser.jison`) parse the TSL specification and generate abstract syntax tree. 
Then, the syntax tree is taken by the generator (`generator.ts`) to create the corresponding trial tables.  

The code is written in TypeScript, together with `worker.js` which is copied (with additions at the header and footer) from the Touchstone 2 codebase.
The source code is stored in `src` and the compiled code is in `dist`.
However, `worker.js` need to be manually copied.

## Related project

[Touchstone2](https://github.com/ZPAC-UZH/touchstone2) a GUI for designing experiments.


## Instlalation and scripts

- `npm run build` - compiles the TypeScript files to JavaScript
- `npm run test` - runs all unit tests
- `npm run trial-table` - generates a trial table for 4 participants based on a tsl file
- `parser` - returns the parsed object from tsl
- `rpc-server` - starts up the rpc server

## Compiling one TSL file

* Compiling one TSL file

```bash
node dist/src/run_parser.js [tsl_path]
```

If `tsl_path` is not set, the script use the variable `input_path` defined in the file.

This command is also good if the parser (`tsl.jison`) doesn't compile properly because the detailed parsing error will be printed in the console. 

* Generating trial table

```bash
node dist/src/run_generator.js [tsl_path]
```

## Testing

The test cases are in `test` folder.
TSL input are in the `test/testcases` folder.
 
Run the tests with:

```bash
npm test
```

This will run all tests in the folder, watch for file changes, and re-run them.
If you add a new test file, you'll have quit (Ctrl + C) and re-run this command.


## Calling TSL from a remote process

TSL can be called from other process, which may be written in another language such as Python. 

* Install ZeroMQ. 
  * Mac: 
    * install [homebrew](https://brew.sh/)
    * run `brew install zeromq`
* Install zerorpc-node `npm install --no-save zerorpc`
* Run the server `node dist/src/rpc_server.js`

The server will listen to requests at port 4242. (The port number is hard-coded.)


### Example Python 3 client

* Install `msgpack`: `pip install msgpack`
* Install `zerorpc`:  `pip install zerorpc`
* Run the example: `python examples/python_rpc_client/client.py`


## Extension

### Trial table generator

To add a new type of a trial table generator that corresponds to the design node in TSL abstract syntax tree, 
simply create the generator with the function signature in the type `TSLGeneratorFunction` (see: `tsl_types.ts`).

Then, register the function with the corresponding name of the AST node with the following command:

```javascript
TSLStrategyRegistry.sharedRegistry().addGeneratorForStrategy("between", generator);
``` 

See an example in `src/counterbalancing/between.ts`.

## Tips

To debug the jison code, the following command will allow you to print entire hierarchy of variables. 

```javascript
console.log(require('util').inspect(result, true, 10)); 
```

## TODOs

All TODOs are commented in the code in `src` folder. 

## Credits

TSL is a work by the [People and Computing Lab (ZPAC) at the University of Zurich](https://zpac.ch) and the [ex)situ lab](https://ex-situ.lri.fr/).

If you use or build upon TSL, please cite the following paper.

> Alexander Eiselmayer, Chat Wacharamanotham, Michel Beaudouin-Lafon, and Wendy E. Mackay. 2019. Touchstone2: An Interactive Environment for Exploring Trade-offs in HCI Experiment Design. In CHI Conference on Human Factors in Computing Systems Proceedings (CHI 2019), May 4–9, 2019, Glasgow, Scotland Uk. ACM, New York, NY, USA, 11 pages. https://doi.org/10.1145/3290605.3300447


```bibtex
@inproceedings{Eiselmayer:2019:TIE:3290605.3300447,
 author = {Eiselmayer, Alexander and Wacharamanotham, Chat and Beaudouin-Lafon, Michel and Mackay, Wendy E.},
 title = {Touchstone2: An Interactive Environment for Exploring Trade-offs in HCI Experiment Design},
 booktitle = {Proceedings of the 2019 CHI Conference on Human Factors in Computing Systems},
 series = {CHI '19},
 year = {2019},
 isbn = {978-1-4503-5970-2},
 location = {Glasgow, Scotland Uk},
 pages = {217:1--217:11},
 articleno = {217},
 numpages = {11},
 url = {http://doi.acm.org/10.1145/3290605.3300447},
 doi = {10.1145/3290605.3300447},
 acmid = {3300447},
 publisher = {ACM},
 address = {New York, NY, USA},
 keywords = {counterbalancing, experiment design, power analysis, randomization, reproducibility},
} 
```

// let zerorpc = require("zerorpc");
import * as zerorpc from "zerorpc"
import { generate_tsl, generate_ast } from "./run_generator";

let server = new zerorpc.Server({
    generate_tsl: function(tsl, pCount, reply) {
        reply(null, generate_tsl(tsl, pCount));
    },
    generate_ast: function(ast, pCount, reply) {
        reply(null, generate_ast(ast, pCount));
    },
});

server.bind("tcp://0.0.0.0:4242");

server.on("error", function(error) {
    console.error("RPC server error:", error);
});
#!/usr/bin/env node

import { EVM64 } from '../core/evm64-core.mjs';

const args = process.argv.slice(2);

let traceMode = false;
let code = "";

if (args[0] !== 'run') {
    console.log("Usage: node app/evm64-cli.mjs run --trace <bytecode>");
    process.exit(1);
}

for (let i = 1; i < args.length; i++) {
    if (args[i] === '--trace') {
        traceMode = true;
    } else {
        code = args[i];
    }
}

if (!code) {
    console.error("No bytecode provided.");
    process.exit(1);
}

const vm = new EVM64(code, "10000000000");
const result = vm.run(traceMode);

if (traceMode) {
    result.traces.forEach(t => console.log(JSON.stringify(t)));
}

console.log(JSON.stringify({
    output: result.output,
    gasUsed: result.gasUsed
}));

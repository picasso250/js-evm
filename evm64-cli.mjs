#!/usr/bin/env node

import { EVM64 } from './core/evm64.mjs';

const args = process.argv.slice(2);

let traceMode = false;
let code = "";

if (args[0] !== 'run') {
    console.log("Usage: node evm64-cli.mjs run --trace <bytecode>");
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
    result.traces.forEach(t => console.error(JSON.stringify(t)));
    console.error(JSON.stringify({
        output: result.output.length > 0 ? Array.from(result.output).map(b => b.toString(16).padStart(2, '0')).join('') : '',
        gasUsed: result.gasUsed,
        error: result.reverted ? 'execution reverted' : undefined
    }));
} else {
    console.log(result.output.length > 0 ? '0x' +Array.from(result.output).map(b => b.toString(16).padStart(2, '0')).join('') : '');
}

#!/usr/bin/env node

import { Compiler } from './core/compiler.mjs';
import { readFileSync } from 'fs';

const args = process.argv.slice(2);

if (args[0] === 'compile') {
    const filename = args[1];
    if (!filename) {
        console.error("Usage: node compiler-cli.mjs compile <file>");
        process.exit(1);
    }
    const source = readFileSync(filename, 'utf-8');
    const compiler = new Compiler();
    const bytecode = compiler.compile(source);
    console.log(bytecode);
} 
else if (args[0] === 'disassemble') {
    const bytecode = args[1];
    if (!bytecode) {
        console.error("Usage: node compiler-cli.mjs disassemble <bytecode>");
        process.exit(1);
    }
    const compiler = new Compiler();
    console.log(compiler.disassemble(bytecode));
}
else {
    console.log("Usage: node compiler-cli.mjs <command> [args]");
    console.log("Commands:");
    console.log("  compile <file>      - Compile assembly to bytecode");
    console.log("  disassemble <hex>   - Disassemble bytecode to assembly");
}

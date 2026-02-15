import { Compiler } from './core/compiler.mjs';
import { EVM64 } from './core/evm64.mjs';

const source = `
    PUSH1 10

start:
    JUMPDEST
    DUP1
    ISZERO
    PUSH1 @end
    JUMPI
    PUSH1 1
    SWAP1
    SUB
    PUSH1 @start
    JUMP

end:
    JUMPDEST
    PUSH1 0xFF
    STOP
`;

console.log("Compiling...");
const compiler = new Compiler();
const bytecode = compiler.compile(source);
console.log(`Bytecode: ${bytecode}`);

console.log("\nRunning...");
const vm = new EVM64(bytecode, 100000);
const result = vm.run(true);

const lastTraces = result.traces.slice(-20);
lastTraces.forEach(t => console.log(JSON.stringify(t)));

console.log(`\nTotal Gas Used: ${parseInt(result.gasUsed, 16)}`);

export const toHex = (bigIntVal) => '0x' + bigIntVal.toString(16);

export const toU64 = (bigIntVal) => BigInt.asUintN(64, bigIntVal);

export const parseCode = (hexString) => {
    if (hexString.startsWith('0x')) hexString = hexString.slice(2);
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
};

export const OPCODES = {
    0x00: { name: 'STOP', cost: 0, run: (vm) => { vm.running = false; } },
    0x01: { name: 'ADD', cost: 3, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        vm.stack.push(toU64(a + b));
    }},
    0x02: { name: 'MUL', cost: 5, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        vm.stack.push(toU64(a * b));
    }},
    0x03: { name: 'SUB', cost: 3, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        vm.stack.push(toU64(a - b));
    }},
    0x04: { name: 'DIV', cost: 5, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        if (b === 0n) vm.stack.push(0n);
        else vm.stack.push(toU64(a / b));
    }},
    0x60: { name: 'PUSH1', cost: 3, run: (vm) => {
        if (vm.pc + 1 >= vm.code.length) throw new Error("PUSH1 out of bounds");
        const val = BigInt(vm.code[vm.pc + 1]);
        vm.stack.push(val);
        vm.pc += 1;
    }},
};

export class EVM64 {
    constructor(codeHex, gasLimit) {
        this.code = parseCode(codeHex);
        this.pc = 0;
        this.stack = [];
        this.memory = [];
        this.running = true;
        this.gas = BigInt(gasLimit);
        this.initialGas = BigInt(gasLimit);
        this.depth = 1;
        this.traces = [];
    }

    getTrace(opCode, opName, cost, pc) {
        const stackDump = this.stack.map(n => toHex(n));
        
        return {
            pc: pc,
            op: opCode,
            gas: toHex(this.gas),
            gasCost: toHex(BigInt(cost)),
            memSize: this.memory.length,
            stack: stackDump,
            depth: this.depth,
            refund: 0,
            opName: opName
        };
    }

    run(trace = false) {
        this.traces = [];
        
        while (this.running && this.pc < this.code.length) {
            const op = this.code[this.pc];
            const opDef = OPCODES[op];
            const currentPc = this.pc;

            if (!opDef) {
                this.running = false;
                break;
            }

            if (this.gas < opDef.cost) {
                this.running = false;
                break;
            }
            
            if (trace) {
                this.traces.push(this.getTrace(op, opDef.name, opDef.cost, currentPc));
            }

            this.gas -= BigInt(opDef.cost);

            try {
                opDef.run(this);
            } catch (e) {
                this.running = false;
            }

            if (this.running) {
                this.pc++;
            }
        }
        
        return {
            output: "",
            gasUsed: toHex(this.initialGas - this.gas),
            traces: this.traces
        };
    }
}

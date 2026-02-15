import { toHex, parseCode } from '../common/utils.mjs';
import { createOpcodes } from '../common/opcodes.mjs';

export class EVM64 {
    constructor(codeHex, gasLimit) {
        let code = parseCode(codeHex);
        if (code.length === 0 || code[code.length - 1] !== 0x00) {
            code = [...code, 0x00];
        }
        this.code = code;
        this.pc = 0;
        this.stack = [];
        this.memory = [];
        this.running = true;
        this.gas = BigInt(gasLimit);
        this.initialGas = BigInt(gasLimit);
        this.depth = 1;
        this.traces = [];
        
        const { toU64 } = this._getUtils();
        this.opcodes = createOpcodes(toU64);
    }

    _getUtils() {
        return { toU64: (val) => BigInt.asUintN(64, val) };
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
            const opDef = this.opcodes[op];
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

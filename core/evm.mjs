import { parseCode, toHex } from '../common/utils.mjs';
import { createOpcodes } from '../common/opcodes.mjs';
import { Code } from './code.mjs';
import { Memory } from './memory.mjs';

export class EVM64 {
    constructor(codeHex, gasLimit) {
        // 1. 初始化 Code 对象 (自动做 JUMPDEST 分析)
        this.code = new Code(parseCode(codeHex));
        
        // 2. 初始化核心组件
        this.stack = [];
        this.memory = new Memory();
        this.opcodes = createOpcodes(); // 注入 vm 在 run 中传 this
        
        // 3. 状态
        this.pcAtStart = 0; // 用于 PC 指令
        this.running = true;
        this.gas = BigInt(gasLimit);
        this.initialGas = BigInt(gasLimit);
        this.traces = [];
    }

    _snapshotTrace(op, opName, cost, pc) {
        return {
            pc: pc,
            op: op,
            opName: opName,
            gas: toHex(this.gas),
            gasCost: toHex(BigInt(cost)),
            memSize: this.memory.size(),
            stack: this.stack.map(n => toHex(n)),
            depth: 1
        };
    }

    run(trace = false) {
        this.traces = [];
        
        // 循环条件：Code 游标未结束 且 运行标志为真
        while (this.running && !this.code.isFinished) {
            
            // 1. 记录指令开始时的 PC (用于 Trace 和 PC 指令)
            this.pcAtStart = this.code.currentPc;
            
            // 2. 读取指令 (Code 内部游标自动 +1)
            const op = this.code.readOp();
            const opDef = this.opcodes[op];

            if (!opDef) {
                console.error(`Unknown Opcode: ${toHex(op)} at ${this.pcAtStart}`);
                this.running = false;
                break;
            }

            // 3. 扣除 Gas
            if (this.gas < opDef.cost) {
                this.running = false;
                break;
            }
            
            // 4. Trace (记录执行前的状态)
            if (trace) {
                this.traces.push(this._snapshotTrace(op, opDef.name, opDef.cost, this.pcAtStart));
            }

            this.gas -= BigInt(opDef.cost);

            // 5. 执行指令
            try {
                // 将 VM 实例传给指令，指令内部调用 stack.pop/push 或 code.jump
                opDef.run(this);
            } catch (e) {
                console.error(`Execution Error: ${e.message}`);
                this.running = false;
            }
            
            // 注意：这里不需要 pc++，所有游标移动都在 readOp, readBytes, jump 中完成了
        }
        
        return {
            output: "", // 如果实现 RETURN，这里会有值
            gasUsed: toHex(this.initialGas - this.gas),
            traces: this.traces
        };
    }
}
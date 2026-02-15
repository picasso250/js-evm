#!/usr/bin/env node

const process = require('process');

// --- 工具函数 ---

// 将 BigInt 转换为 hex 字符串 (e.g., 0x1a)
const toHex = (bigIntVal) => '0x' + bigIntVal.toString(16);

// 强制转换为 64 位无符号整数 (模拟 64-bit 架构)
const toU64 = (bigIntVal) => BigInt.asUintN(64, bigIntVal);

// 解析 hex 字符串代码为 Uint8Array
const parseCode = (hexString) => {
    if (hexString.startsWith('0x')) hexString = hexString.slice(2);
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
};

// --- 操作码定义 (Opcodes) ---
const OPCODES = {
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
        // 用户指定顺序: a=pop(); b=pop(); r = a - b
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        vm.stack.push(toU64(a - b));
    }},
    0x04: { name: 'DIV', cost: 5, run: (vm) => {
        const a = vm.stack.pop(); // a is top
        const b = vm.stack.pop();
        if (b === 0n) vm.stack.push(0n);
        else vm.stack.push(toU64(a / b)); // 注意：这是 a / b，符合你的栈顺序逻辑
    }},
    // PUSH 指令
    0x60: { name: 'PUSH1', cost: 3, run: (vm) => {
        if (vm.pc + 1 >= vm.code.length) throw new Error("PUSH1 out of bounds");
        const val = BigInt(vm.code[vm.pc + 1]);
        vm.stack.push(val);
        vm.pc += 1; // 额外增加 PC 跳过参数
    }},
};

// --- EVM 类 ---

class EVM64 {
    constructor(codeHex, gasLimit) {
        this.code = parseCode(codeHex);
        this.pc = 0;
        this.stack = [];
        this.memory = []; // 简化内存模型
        this.running = true;
        this.gas = BigInt(gasLimit);
        this.initialGas = BigInt(gasLimit);
        this.depth = 1;
    }

    printTrace(opCode, opName, cost, pcStr) {
        // Geth 风格的 stack 输出: ["0x1", "0x2"]
        const stackDump = this.stack.map(n => toHex(n));
        
        const trace = {
            pc: parseInt(pcStr), // 使用指令开始时的 PC
            op: opCode,
            gas: toHex(this.gas),
            gasCost: toHex(BigInt(cost)),
            memSize: this.memory.length,
            stack: stackDump,
            depth: this.depth,
            refund: 0,
            opName: opName
        };
        
        // 直接打印紧凑的 JSON，不换行
        console.log(JSON.stringify(trace));
    }

    run(trace = false) {
        while (this.running && this.pc < this.code.length) {
            const op = this.code[this.pc];
            const opDef = OPCODES[op];
            
            // 当前指令的 PC
            const currentPc = this.pc;

            if (!opDef) {
                console.error(`Unknown opcode: 0x${op.toString(16)} at PC ${this.pc}`);
                this.running = false;
                break;
            }

            // 扣除 Gas
            if (this.gas < opDef.cost) {
                console.error("Out of gas");
                this.running = false;
                break;
            }
            
            // 如果开启 Trace，在执行指令前打印状态
            // 注意：Trace 通常打印的是执行该指令 *之前* 的状态（包括即将消耗的 gas）
            if (trace) {
                this.printTrace(op, opDef.name, opDef.cost, currentPc);
            }

            this.gas -= BigInt(opDef.cost);

            // 执行指令
            try {
                opDef.run(this);
            } catch (e) {
                console.error(`Error executing ${opDef.name}: ${e.message}`);
                this.running = false;
            }

            // 推进 PC (PUSH 指令内部已经额外推进了参数长度)
            if (this.running) {
                this.pc++;
            }
        }
        
        return {
            output: "",
            gasUsed: toHex(this.initialGas - this.gas)
        };
    }
}

// --- CLI 入口 ---

function main() {
    const args = process.argv.slice(2);
    
    // 简单的参数解析
    let traceMode = false;
    let code = "";
    
    // 查找 run 命令
    if (args[0] !== 'run') {
        console.log("Usage: node evm64.js run --trace <bytecode>");
        return;
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
        return;
    }

    // 默认给 100亿 Gas (0x2540be400)
    const vm = new EVM64(code, "10000000000");
    const result = vm.run(traceMode);
    
    // 最终输出
    console.log(JSON.stringify(result));
}

main();
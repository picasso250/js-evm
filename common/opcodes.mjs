import { toU64, toS64 } from '../common/utils.mjs';

/**
 * 二元操作高阶函数 (HOF) - 防呆设计
 * 强制定义：top (栈顶), next (次栈顶)
 */
const createBinOp = (vm, logicFn) => {
    const top = vm.stack.pop();
    const next = vm.stack.pop();
    // 自动应用 64 位无符号截断
    vm.stack.push(toU64(logicFn(top, next)));
};

/**
 * 有符号二元操作 (处理 SDIV 等)
 */
const createSignedBinOp = (vm, logicFn) => {
    const top = toS64(vm.stack.pop());
    const next = toS64(vm.stack.pop());
    // 结果转回 U64 存储
    vm.stack.push(toU64(logicFn(top, next)));
};

export const OPCODE_NAMES = {
    STOP: 0x00, ADD: 0x01, MUL: 0x02, SUB: 0x03, DIV: 0x04, SDIV: 0x05,
    MOD: 0x06, SMOD: 0x07, ADDMOD: 0x08, MULMOD: 0x09, EXP: 0x0A,
    SIGNEXTEND: 0x0B, LT: 0x10, GT: 0x11, SLT: 0x12, SGT: 0x13,
    EQ: 0x14, ISZERO: 0x15, AND: 0x16, OR: 0x17, XOR: 0x18, NOT: 0x19,
    BYTE: 0x1A, SHL: 0x1B, SHR: 0x1C, SAR: 0x1D,
    JUMP: 0x56, JUMPI: 0x57, PC: 0x58, JUMPDEST: 0x5B,
    PUSH1: 0x60, MLOAD: 0x51, MSTORE: 0x52
};

export const createOpcodes = () => ({
    // --- 算术 ---
    0x00: { name: 'STOP', cost: 0, run: (vm) => { vm.running = false; } },
    
    0x01: { name: 'ADD', cost: 3, run: (vm) => createBinOp(vm, (top, next) => top + next) },
    0x02: { name: 'MUL', cost: 5, run: (vm) => createBinOp(vm, (top, next) => top * next) },
    
    // SUB: 栈顶 - 次栈顶 (Top - Next)
    // 注意：EVM 标准是 stack[0] - stack[1]。
    // 如果 stack 是 [Top, Next, ...]，那就是 Top - Next。
    0x03: { name: 'SUB', cost: 3, run: (vm) => createBinOp(vm, (top, next) => top - next) },
    
    0x04: { name: 'DIV', cost: 5, run: (vm) => createBinOp(vm, (top, next) => next === 0n ? 0n : top / next) },
    0x05: { name: 'SDIV', cost: 5, run: (vm) => createSignedBinOp(vm, (top, next) => next === 0n ? 0n : top / next) },
    
    0x0A: { name: 'EXP', cost: 10, run: (vm) => createBinOp(vm, (base, exponent) => base ** exponent) },
    
    0x06: { name: 'MOD', cost: 5, run: (vm) => createBinOp(vm, (top, next) => next === 0n ? 0n : top % next) },
    0x07: { name: 'SMOD', cost: 5, run: (vm) => createSignedBinOp(vm, (top, next) => next === 0n ? 0n : top % next) },
    
    0x08: { name: 'ADDMOD', cost: 8, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        const n = vm.stack.pop();
        vm.stack.push(n === 0n ? 0n : toU64((a + b) % n));
    }},
    
    0x09: { name: 'MULMOD', cost: 8, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        const n = vm.stack.pop();
        vm.stack.push(n === 0n ? 0n : toU64((a * b) % n));
    }},
    
    0x0B: { name: 'SIGNEXTEND', cost: 5, run: (vm) => {
        const top = vm.stack.pop();
        const next = vm.stack.pop();
        if (top < 32n) {
            const signBit = BigInt(top) * 8n + 7n;
            const mask = 1n << signBit;
            const result = (next & mask) === 0n ? next & ((1n << (signBit + 1n)) - 1n) : next | ~((1n << (signBit + 1n)) - 1n);
            vm.stack.push(toS64(result));
        } else {
            vm.stack.push(next);
        }
    }},

    // --- 比较 ---
    0x10: { name: 'LT', cost: 3, run: (vm) => createBinOp(vm, (top, next) => top < next ? 1n : 0n) },
    0x11: { name: 'GT', cost: 3, run: (vm) => createBinOp(vm, (top, next) => top > next ? 1n : 0n) },
    0x12: { name: 'SLT', cost: 3, run: (vm) => createSignedBinOp(vm, (top, next) => top < next ? 1n : 0n) },
    0x13: { name: 'SGT', cost: 3, run: (vm) => createSignedBinOp(vm, (top, next) => top > next ? 1n : 0n) },
    0x14: { name: 'EQ', cost: 3, run: (vm) => createBinOp(vm, (top, next) => top === next ? 1n : 0n) },
    0x15: { name: 'ISZERO', cost: 3, run: (vm) => {
        const top = vm.stack.pop();
        vm.stack.push(top === 0n ? 1n : 0n);
    }},

    // --- 位运算 ---
    0x16: { name: 'AND', cost: 3, run: (vm) => createBinOp(vm, (top, next) => top & next) },
    0x17: { name: 'OR', cost: 3, run: (vm) => createBinOp(vm, (top, next) => top | next) },
    0x18: { name: 'XOR', cost: 3, run: (vm) => createBinOp(vm, (top, next) => top ^ next) },
    0x19: { name: 'NOT', cost: 3, run: (vm) => {
        const top = vm.stack.pop();
        vm.stack.push(~top & 0xFFFFFFFFFFFFFFFFn);
    }},
    0x1A: { name: 'BYTE', cost: 3, run: (vm) => {
        const idx = Number(vm.stack.pop());
        const val = vm.stack.pop();
        if (idx >= 8) {
            vm.stack.push(0n);
        } else {
            vm.stack.push((val >> BigInt((7 - idx) * 8)) & 0xFFn);
        }
    }},
    0x1B: { name: 'SHL', cost: 3, run: (vm) => createBinOp(vm, (shift, val) => (val << shift) & 0xFFFFFFFFFFFFFFFFn) },
    0x1C: { name: 'SHR', cost: 3, run: (vm) => createBinOp(vm, (shift, val) => val >> shift) },
    0x1D: { name: 'SAR', cost: 3, run: (vm) => {
        const shift = Number(vm.stack.pop());
        const val = toS64(vm.stack.pop());
        if (shift >= 64) {
            vm.stack.push(val < 0n ? 0xFFFFFFFFFFFFFFFFn : 0n);
        } else if (val < 0n) {
            const mask = (1n << BigInt(64 - shift)) - 1n;
            vm.stack.push(toU64((val >> BigInt(shift)) | (mask << BigInt(64 - shift))));
        } else {
            vm.stack.push(val >> BigInt(shift));
        }
    }},

    // --- 控制流 (委托给 vm.code) ---
    0x56: { name: 'JUMP', cost: 8, run: (vm) => {
        const dest = vm.stack.pop();
        vm.code.jump(dest); // 安全检查在 Code 类中完成
    }},
    
    0x57: { name: 'JUMPI', cost: 10, run: (vm) => {
        const dest = vm.stack.pop();
        const cond = vm.stack.pop();
        if (cond !== 0n) {
            vm.code.jump(dest);
        }
    }},
    
    0x5B: { name: 'JUMPDEST', cost: 1, run: (vm) => { /* No-op */ } },
    
    0x58: { name: 'PC', cost: 2, run: (vm) => {
        // -1 是因为 code.readOp() 已经推进了 PC，Trace 时我们想要的是当前指令的 PC
        // 但这里我们想要的是当前指令的地址，所以最好由 vm 传入 pre-execution PC
        // 或者简单地：code.currentPc - 1 (如果指令长1字节)
        // 更严谨的做法是在 run loop 里记录 pcAtStart
        vm.stack.push(BigInt(vm.pcAtStart));
    }},

    // --- 栈操作 ---
    // PUSH1: 从 Code 游标读取 1 字节
    0x60: { name: 'PUSH1', cost: 3, run: (vm) => {
        const val = vm.code.readBytes(1);
        vm.stack.push(val);
    }},
    
    // 支持更多 PUSH... 
    // 0x61 PUSH2 => readBytes(2)
    
    // --- 内存 ---
    0x51: { name: 'MLOAD', cost: 3, run: (vm) => {
        const offset = Number(vm.stack.pop());
        vm.stack.push(vm.memory.load(offset));
    }},
    0x52: { name: 'MSTORE', cost: 3, run: (vm) => {
        const offset = Number(vm.stack.pop());
        const val = vm.stack.pop();
        vm.memory.store(offset, val);
    }},
});
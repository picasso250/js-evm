import { toU64, toS64 } from '../common/utils.mjs';

const createBinOp = (vm, logicFn) => {
    const top = vm.stack.pop();
    const next = vm.stack.pop();
    vm.stack.push(toU64(logicFn(top, next)));
};

const createSignedBinOp = (vm, logicFn) => {
    const top = toS64(vm.stack.pop());
    const next = toS64(vm.stack.pop());
    vm.stack.push(toU64(logicFn(top, next)));
};

export const OPCODE_NAMES = {
    STOP: 0x00, ADD: 0x01, MUL: 0x02, SUB: 0x03, DIV: 0x04, SDIV: 0x05,
    MOD: 0x06, SMOD: 0x07, ADDMOD: 0x08, MULMOD: 0x09, EXP: 0x0A,
    SIGNEXTEND: 0x0B, LT: 0x10, GT: 0x11, SLT: 0x12, SGT: 0x13,
    EQ: 0x14, ISZERO: 0x15, AND: 0x16, OR: 0x17, XOR: 0x18, NOT: 0x19,
    BYTE: 0x1A, SHL: 0x1B, SHR: 0x1C, SAR: 0x1D,
    JUMP: 0x56, JUMPI: 0x57, PC: 0x58, JUMPDEST: 0x5B,
    PUSH0: 0x5F, PUSH1: 0x60, PUSH2: 0x61, PUSH3: 0x62, PUSH4: 0x63,
    PUSH5: 0x64, PUSH6: 0x65, PUSH7: 0x66, PUSH8: 0x67,
    DUP1: 0x80, DUP2: 0x81, DUP3: 0x82, DUP4: 0x83, DUP5: 0x84,
    DUP6: 0x85, DUP7: 0x86, DUP8: 0x87, DUP9: 0x88, DUP10: 0x89,
    DUP11: 0x8A, DUP12: 0x8B, DUP13: 0x8C, DUP14: 0x8D, DUP15: 0x8E, DUP16: 0x8F,
    SWAP1: 0x90, SWAP2: 0x91, SWAP3: 0x92, SWAP4: 0x93, SWAP5: 0x94,
    SWAP6: 0x95, SWAP7: 0x96, SWAP8: 0x97, SWAP9: 0x98, SWAP10: 0x99,
    SWAP11: 0x9A, SWAP12: 0x9B, SWAP13: 0x9C, SWAP14: 0x9D, SWAP15: 0x9E, SWAP16: 0x9F,
    MLOAD: 0x51, MSTORE: 0x52, MSTORE8: 0x53, MSIZE: 0x59, MCOPY: 0x5E,
    POP: 0x50
};

export const createOpcodes = () => {
    const opcodes = {
        // --- 算术 ---
        0x00: { name: 'STOP', cost: 0, run: (vm) => { vm.running = false; } },
        
        0x01: { name: 'ADD', cost: 3, run: (vm) => createBinOp(vm, (top, next) => top + next) },
        0x02: { name: 'MUL', cost: 5, run: (vm) => createBinOp(vm, (top, next) => top * next) },
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

        // --- 控制流 ---
        0x56: { name: 'JUMP', cost: 8, run: (vm) => {
            const dest = vm.stack.pop();
            vm.code.jump(dest);
        }},
        
        0x57: { name: 'JUMPI', cost: 10, run: (vm) => {
            const dest = vm.stack.pop();
            const cond = vm.stack.pop();
            if (cond !== 0n) {
                vm.code.jump(dest);
            }
        }},
        
        0x5B: { name: 'JUMPDEST', cost: 1, run: (vm) => { } },
        
        0x58: { name: 'PC', cost: 2, run: (vm) => {
            vm.stack.push(BigInt(vm.pcAtStart));
        }},

        // --- 内存 ---
        0x50: { name: 'POP', cost: 2, run: (vm) => vm.stack.pop() },
        
        0x51: { name: 'MLOAD', cost: 3, run: (vm) => {
            const offset = Number(vm.stack.pop());
            vm.stack.push(vm.memory.load(offset));
        }},
        0x52: { name: 'MSTORE', cost: 3, run: (vm) => {
            const offset = Number(vm.stack.pop());
            const val = vm.stack.pop();
            vm.memory.store(offset, val);
        }},
        0x53: { name: 'MSTORE8', cost: 3, run: (vm) => {
            const offset = Number(vm.stack.pop());
            const val = vm.stack.pop();
            vm.memory.store8(offset, val);
        }},
        0x59: { name: 'MSIZE', cost: 2, run: (vm) => {
            vm.stack.push(BigInt(vm.memory.size()));
        }},
        0x5E: { name: 'MCOPY', cost: 3, run: (vm) => {
            const dest = Number(vm.stack.pop());
            const src = Number(vm.stack.pop());
            const len = Number(vm.stack.pop());
            vm.memory.copy(dest, src, len);
        }},
    };

    // PUSH0 (Shanghai)
    opcodes[0x5F] = { name: 'PUSH0', cost: 2, run: (vm) => vm.stack.push(0n) };

    // PUSH1-PUSH8 (64-bit limit)
    for (let i = 1; i <= 8; i++) {
        const op = 0x60 + (i - 1);
        opcodes[op] = {
            name: `PUSH${i}`,
            cost: 3,
            run: (vm) => {
                const val = vm.code.readBytes(i);
                vm.stack.push(val);
            }
        };
    }

    // DUP1-DUP16
    for (let i = 1; i <= 16; i++) {
        const op = 0x80 + (i - 1);
        opcodes[op] = {
            name: `DUP${i}`,
            cost: 3,
            run: (vm) => {
                const stackLen = vm.stack.length;
                if (stackLen < i) {
                    throw new Error("Stack underflow");
                }
                const val = vm.stack[stackLen - i];
                vm.stack.push(val);
            }
        };
    }

    // SWAP1-SWAP16
    for (let i = 1; i <= 16; i++) {
        const op = 0x90 + (i - 1);
        opcodes[op] = {
            name: `SWAP${i}`,
            cost: 3,
            run: (vm) => {
                const stackLen = vm.stack.length;
                if (stackLen < i + 1) {
                    throw new Error("Stack underflow");
                }
                const topIdx = stackLen - 1;
                const targetIdx = stackLen - 1 - i;
                const temp = vm.stack[topIdx];
                vm.stack[topIdx] = vm.stack[targetIdx];
                vm.stack[targetIdx] = temp;
            }
        };
    }

    return opcodes;
};

export const createOpcodes = (toU64) => ({
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
        if (a === 0n) vm.stack.push(0n);
        else vm.stack.push(toU64(b / a));
    }},
    0x05: { name: 'SDIV', cost: 5, run: (vm) => {
        const a = BigInt.asIntN(64, vm.stack.pop());
        const b = BigInt.asIntN(64, vm.stack.pop());
        if (a === 0n) {
            vm.stack.push(0n);
        } else {
            const result = a / b;
            vm.stack.push(toU64(result));
        }
    }},
    0x06: { name: 'MOD', cost: 5, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        if (a === 0n) vm.stack.push(0n);
        else vm.stack.push(toU64(b % a));
    }},
    0x07: { name: 'SMOD', cost: 5, run: (vm) => {
        const a = BigInt.asIntN(64, vm.stack.pop());
        const b = BigInt.asIntN(64, vm.stack.pop());
        if (a === 0n) {
            vm.stack.push(0n);
        } else {
            const result = b % a;
            vm.stack.push(toU64(result));
        }
    }},
    0x08: { name: 'ADDMOD', cost: 8, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        const n = vm.stack.pop();
        if (n === 0n) vm.stack.push(0n);
        else vm.stack.push(toU64((a + b) % n));
    }},
    0x09: { name: 'MULMOD', cost: 8, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        const n = vm.stack.pop();
        if (n === 0n) vm.stack.push(0n);
        else vm.stack.push(toU64((a * b) % n));
    }},
    0x0A: { name: 'EXP', cost: 10, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        vm.stack.push(toU64(a ** b));
    }},
    0x0B: { name: 'SIGNEXTEND', cost: 5, run: (vm) => {
        const b = vm.stack.pop();
        const x = vm.stack.pop();
        if (b >= 32n) {
            vm.stack.push(x);
        } else {
            const signBit = BigInt(b) * 8n + 7n;
            const mask = (1n << (signBit + 1n)) - 1n;
            const sign = (x >> signBit) & 1n;
            if (sign) {
                vm.stack.push(toU64(x | (~mask & ((1n << 64n) - 1n))));
            } else {
                vm.stack.push(toU64(x & mask));
            }
        }
    }},
    0x10: { name: 'LT', cost: 3, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        vm.stack.push(b < a ? 1n : 0n);
    }},
    0x11: { name: 'GT', cost: 3, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        vm.stack.push(b > a ? 1n : 0n);
    }},
    0x12: { name: 'SLT', cost: 3, run: (vm) => {
        const a = BigInt.asIntN(64, vm.stack.pop());
        const b = BigInt.asIntN(64, vm.stack.pop());
        vm.stack.push(b < a ? 1n : 0n);
    }},
    0x13: { name: 'SGT', cost: 3, run: (vm) => {
        const a = BigInt.asIntN(64, vm.stack.pop());
        const b = BigInt.asIntN(64, vm.stack.pop());
        vm.stack.push(b > a ? 1n : 0n);
    }},
    0x14: { name: 'EQ', cost: 3, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        vm.stack.push(a === b ? 1n : 0n);
    }},
    0x15: { name: 'ISZERO', cost: 3, run: (vm) => {
        const a = vm.stack.pop();
        vm.stack.push(a === 0n ? 1n : 0n);
    }},
    0x16: { name: 'AND', cost: 3, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        vm.stack.push(toU64(a & b));
    }},
    0x17: { name: 'OR', cost: 3, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        vm.stack.push(toU64(a | b));
    }},
    0x18: { name: 'XOR', cost: 3, run: (vm) => {
        const a = vm.stack.pop();
        const b = vm.stack.pop();
        vm.stack.push(toU64(a ^ b));
    }},
    0x19: { name: 'NOT', cost: 3, run: (vm) => {
        const a = vm.stack.pop();
        vm.stack.push(toU64(~a));
    }},
    0x1A: { name: 'BYTE', cost: 3, run: (vm) => {
        const i = vm.stack.pop();
        const x = vm.stack.pop();
        if (i >= 8n) {
            vm.stack.push(0n);
        } else {
            const byteIndex = 7 - Number(i);
            const byte = (x >> (byteIndex * 8n)) & 0xFFn;
            vm.stack.push(byte);
        }
    }},
    0x1B: { name: 'SHL', cost: 3, run: (vm) => {
        const shift = vm.stack.pop();
        const x = vm.stack.pop();
        vm.stack.push(toU64(x << shift));
    }},
    0x1C: { name: 'SHR', cost: 3, run: (vm) => {
        const shift = vm.stack.pop();
        const x = vm.stack.pop();
        vm.stack.push(toU64(x >> shift));
    }},
    0x1D: { name: 'SAR', cost: 3, run: (vm) => {
        const shift = vm.stack.pop();
        const x = BigInt.asIntN(64, vm.stack.pop());
        const result = x >> shift;
        vm.stack.push(toU64(result));
    }},
    0x60: { name: 'PUSH1', cost: 3, run: (vm) => {
        if (vm.pc + 1 >= vm.code.length) throw new Error("PUSH1 out of bounds");
        const val = BigInt(vm.code[vm.pc + 1]);
        vm.stack.push(val);
        vm.pc += 1;
    }},
});

export const OPCODE_NAMES = {
    'STOP': 0x00,
    'ADD': 0x01,
    'MUL': 0x02,
    'SUB': 0x03,
    'DIV': 0x04,
    'SDIV': 0x05,
    'MOD': 0x06,
    'SMOD': 0x07,
    'ADDMOD': 0x08,
    'MULMOD': 0x09,
    'EXP': 0x0A,
    'SIGNEXTEND': 0x0B,
    'LT': 0x10,
    'GT': 0x11,
    'SLT': 0x12,
    'SGT': 0x13,
    'EQ': 0x14,
    'ISZERO': 0x15,
    'AND': 0x16,
    'OR': 0x17,
    'XOR': 0x18,
    'NOT': 0x19,
    'BYTE': 0x1A,
    'SHL': 0x1B,
    'SHR': 0x1C,
    'SAR': 0x1D,
    'PUSH1': 0x60,
};

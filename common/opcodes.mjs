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
        if (b === 0n) vm.stack.push(0n);
        else vm.stack.push(toU64(a / b));
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
    'PUSH1': 0x60,
};

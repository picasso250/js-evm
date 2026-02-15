import { OPCODE_NAMES, createOpcodes } from '../common/opcodes.mjs';
import { bytesToHex, hexToBytes } from '../common/utils.mjs';

export class Compiler {
    constructor() {
        this.opcodes = OPCODE_NAMES;
    }

    compile(source) {
        const lines = source.split('\n')
            .map(line => line.split(';')[0].trim())
            .filter(line => line.length > 0);
        
        const bytes = [];
        
        for (const line of lines) {
            const parts = line.split(/\s+/);
            const op = parts[0].toUpperCase();
            
            if (this.opcodes[op] === undefined) {
                throw new Error(`Unknown opcode: ${op}`);
            }
            
            bytes.push(this.opcodes[op]);
            
            if (op.startsWith('PUSH')) {
                const num = parseInt(parts[1], 16);
                if (isNaN(num) || num < 0 || num > 255) {
                    throw new Error(`Invalid push value: ${parts[1]}`);
                }
                bytes.push(num);
            }
        }
        
        return bytesToHex(new Uint8Array(bytes));
    }

    disassemble(bytecode) {
        const bytes = hexToBytes(bytecode);
        const opcodes = createOpcodes((v) => v);
        const lines = [];
        let i = 0;
        
        while (i < bytes.length) {
            const op = bytes[i];
            const opDef = opcodes[op];
            
            if (!opDef) {
                lines.push(`UNKNOWN 0x${op.toString(16)}`);
                i++;
                continue;
            }
            
            if (opDef.name.startsWith('PUSH')) {
                const val = bytes[i + 1];
                lines.push(`PUSH1 0x${val.toString(16)}`);
                i += 2;
            } else {
                lines.push(opDef.name);
                i++;
            }
        }
        
        return lines.join('\n');
    }
}

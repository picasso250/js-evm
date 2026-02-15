import { OPCODE_NAMES, createOpcodes } from '../common/opcodes.mjs';

// 辅助函数：将 hex 字符串转为 Uint8Array (复用或重写简单版)
const hexToBytes = (hex) => {
    if (hex.startsWith('0x')) hex = hex.slice(2);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
};

export class Compiler {
    constructor() {
        // 反转映射：Code -> Name (用于反汇编)
        this.opcodes = OPCODE_NAMES; // Name -> Code
        this.codeToName = {};
        for (const [name, code] of Object.entries(OPCODE_NAMES)) {
            this.codeToName[code] = name;
        }
    }

    compile(source) {
        const lines = source.split('\n')
            .map(line => line.split(';')[0].trim()) // 去注释
            .filter(line => line.length > 0);
        
        const bytes = [];
        
        for (const line of lines) {
            // 允许用空格分隔: "PUSH1 0xFF"
            const parts = line.split(/\s+/);
            const opName = parts[0].toUpperCase();
            
            const opCode = this.opcodes[opName];
            if (opCode === undefined) {
                throw new Error(`Unknown opcode: ${opName}`);
            }
            
            bytes.push(opCode);
            
            // 核心逻辑：检测是否是 PUSH 指令
            if (opName.startsWith('PUSH') && opName !== 'PUSH0') {
                // 1. 从名字提取字节数: "PUSH8" -> 8
                const size = parseInt(opName.slice(4)); 
                
                if (isNaN(size) || size < 1 || size > 32) {
                    throw new Error(`Invalid PUSH instruction: ${opName}`);
                }

                // 2. 解析参数 (必须提供)
                const argStr = parts[1];
                if (!argStr) {
                    throw new Error(`${opName} requires an argument`);
                }

                // 3. 转为 BigInt (支持 64位大数)
                let val;
                try {
                    val = BigInt(argStr); // 支持 0xFF 或 255 格式
                } catch (e) {
                    throw new Error(`Invalid value for ${opName}: ${argStr}`);
                }

                // 4. 检查数值是否溢出 (比如 PUSH1 不能存 256)
                const maxVal = (1n << (BigInt(size) * 8n)) - 1n;
                if (val > maxVal || val < 0n) {
                    throw new Error(`Value ${argStr} too large for ${opName}`);
                }

                // 5. 大端序写入字节 (Big-Endian)
                // PUSH2 0x1234 -> [0x12, 0x34]
                for (let i = size - 1; i >= 0; i--) {
                    const byte = Number((val >> BigInt(i * 8)) & 0xFFn);
                    bytes.push(byte);
                }
            }
        }
        
        // 输出 Hex 字符串
        return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    disassemble(bytecode) {
        const bytes = hexToBytes(bytecode);
        const lines = [];
        let i = 0;
        
        while (i < bytes.length) {
            const op = bytes[i];
            const opName = this.codeToName[op];
            
            if (!opName) {
                lines.push(`UNKNOWN 0x${op.toString(16)}`);
                i++;
                continue;
            }
            
            // 同样使用名字判断逻辑
            if (opName.startsWith('PUSH') && opName !== 'PUSH0') {
                const size = parseInt(opName.slice(4)); // PUSHN -> N
                
                // 检查字节码是否截断
                if (i + 1 + size > bytes.length) {
                    lines.push(`${opName} (TRUNCATED)`);
                    break;
                }

                // 读取参数 (大端序拼接)
                let val = 0n;
                for (let k = 0; k < size; k++) {
                    val = (val << 8n) | BigInt(bytes[i + 1 + k]);
                }

                lines.push(`${opName} 0x${val.toString(16)}`);
                i += 1 + size; // Opcode(1) + Args(size)
            } else {
                // 普通指令
                lines.push(opName);
                i++;
            }
        }
        
        return lines.join('\n');
    }
}
import { OPCODE_NAMES } from '../common/opcodes.mjs';

export class Compiler {
    constructor() {
        this.opcodes = OPCODE_NAMES; // Name -> Code
        // 反向映射用于反汇编
        this.codeToName = {};
        for (const [name, code] of Object.entries(OPCODE_NAMES)) {
            this.codeToName[code] = name;
        }
    }

    /**
     * 编译汇编代码
     * 支持格式:
     * - 普通指令: ADD, STOP
     * - 带参指令: PUSH1 0xFF
     * - 标签定义: start:
     * - 标签使用: PUSH1 @start
     */
    compile(source) {
        // 1. 预处理：去注释、去空行、分割
        const lines = source.split('\n')
            .map(line => {
                const text = line.split(';')[0].trim(); // 去分号注释
                return text;
            })
            .filter(line => line.length > 0);

        // --- 第一遍扫描：计算标签位置 (Symbol Resolution) ---
        const labels = {}; // { "loop": 5, "end": 12 }
        let byteOffset = 0;

        // 临时存储解析后的指令结构，供第二遍使用
        const parsedLines = [];

        for (const line of lines) {
            // 检查是否是标签定义 (以冒号结尾)
            if (line.endsWith(':')) {
                const labelName = line.slice(0, -1).trim();
                if (labels[labelName] !== undefined) {
                    throw new Error(`Duplicate label: ${labelName}`);
                }
                labels[labelName] = byteOffset;
                continue; // 标签定义本身不占字节空间
            }

            const parts = line.split(/\s+/);
            const opName = parts[0].toUpperCase();
            
            // 获取指令长度
            const opCode = this.opcodes[opName];
            if (opCode === undefined) {
                throw new Error(`Unknown opcode: ${opName}`);
            }

            let size = 1; // 基础 Opcode 长度
            let arg = null;
            let argSize = 0;

            if (opName.startsWith('PUSH') && opName !== 'PUSH0') {
                argSize = parseInt(opName.slice(4)); // PUSH1 -> 1
                if (isNaN(argSize) || argSize < 1 || argSize > 32) {
                    throw new Error(`Invalid PUSH instruction: ${opName}`);
                }
                size += argSize; // Opcode + Data
                arg = parts[1];  // 暂存参数字符串 (@label 或 0x123)
                if (!arg) throw new Error(`${opName} missing argument`);
            }

            parsedLines.push({ opName, opCode, arg, argSize });
            byteOffset += size;
        }

        // --- 第二遍扫描：生成字节码 (Code Generation) ---
        const bytes = [];

        for (const instr of parsedLines) {
            // 1. 写入 Opcode
            bytes.push(instr.opCode);

            // 2. 如果是 PUSH，处理参数
            if (instr.arg !== null) {
                let val;

                // 情况 A: 标签引用 (@loop)
                if (instr.arg.startsWith('@')) {
                    const labelName = instr.arg.slice(1);
                    const targetOffset = labels[labelName];
                    if (targetOffset === undefined) {
                        throw new Error(`Undefined label: ${labelName}`);
                    }
                    val = BigInt(targetOffset);
                } 
                // 情况 B: 普通数值 (0xFF, 10)
                else {
                    try {
                        val = BigInt(instr.arg);
                    } catch (e) {
                        throw new Error(`Invalid value: ${instr.arg}`);
                    }
                }

                // 检查溢出 (offset 是否超过了 PUSHn 能存的大小)
                const maxVal = (1n << (BigInt(instr.argSize) * 8n)) - 1n;
                if (val > maxVal || val < 0n) {
                    throw new Error(`Value ${val} (from ${instr.arg}) too large for ${instr.opName}`);
                }

                // 大端序写入
                for (let i = instr.argSize - 1; i >= 0; i--) {
                    const byte = Number((val >> BigInt(i * 8)) & 0xFFn);
                    bytes.push(byte);
                }
            }
        }
        
        return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // (Disassemble 方法保持不变，它不需要感知标签)
    disassemble(bytecode) {
        // ... (使用你之前的 hexToBytes 和逻辑) ...
        if (!bytecode) return "";
        let hex = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;
        if (hex.length % 2 !== 0) hex = '0' + hex;
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) bytes[i/2] = parseInt(hex.substr(i, 2), 16);

        const lines = [];
        let i = 0;
        while (i < bytes.length) {
            const op = bytes[i];
            const opName = this.codeToName[op];
            if (!opName) { lines.push(`UNKNOWN 0x${op.toString(16)}`); i++; continue; }
            
            if (opName.startsWith('PUSH') && opName !== 'PUSH0') {
                const size = parseInt(opName.slice(4));
                if (i + 1 + size > bytes.length) { lines.push(`${opName} (TRUNCATED)`); break; }
                let val = 0n;
                for (let k = 0; k < size; k++) val = (val << 8n) | BigInt(bytes[i + 1 + k]);
                lines.push(`${opName} 0x${val.toString(16)}`);
                i += 1 + size;
            } else {
                lines.push(opName);
                i++;
            }
        }
        return lines.join('\n');
    }
}
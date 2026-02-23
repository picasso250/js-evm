import { OPCODE_NAMES } from '../common/opcodes.mjs';

export class Compiler {
    constructor() {
        this.opcodes = OPCODE_NAMES; // Name -> Code
        this.codeToName = {};
        for (const [name, code] of Object.entries(OPCODE_NAMES)) {
            this.codeToName[code] = name;
        }
    }

    // ==========================================
    // --- 新增：宏汇编解析器 (Macro-Assembler) ---
    // ==========================================

    _tokenize(str) {
        const tokens = [];
        let i = 0;
        while (i < str.length) {
            if (/\s/.test(str[i])) { i++; continue; }
            if (str[i] === '(' || str[i] === ')' || str[i] === ',') {
                tokens.push(str[i]); i++; continue;
            }
            let word = '';
            while (i < str.length && !/[\s(),]/.test(str[i])) {
                word += str[i]; i++;
            }
            tokens.push(word);
        }
        return tokens;
    }

    _parseExpr(tokens) {
        if (tokens.length === 0) return null;
        const name = tokens.shift();
        if (tokens[0] === '(') {
            tokens.shift(); // consume '('
            const args = [];
            while (tokens[0] !== ')') {
                args.push(this._parseExpr(tokens));
                if (tokens[0] === ',') tokens.shift();
            }
            tokens.shift(); // consume ')'
            return { type: 'call', name, args };
        } else {
            return { type: 'literal', value: name };
        }
    }

    _flattenExpr(ast, result = []) {
        if (ast.type === 'literal') {
            const valStr = ast.value;
            // 1. 如果是标签引用
            if (valStr.startsWith('@')) {
                result.push(`PUSH2 ${valStr}`); // 统一使用 2 字节寻址
            } else {
                // 2. 尝试作为数值处理
                let val;
                try {
                    val = BigInt(valStr);
                } catch(e) {
                    // 3. 如果不是数字，可能是零参指令 (如 CALLDATASIZE)
                    const opName = valStr.toUpperCase();
                    if (this.opcodes[opName] !== undefined) {
                        result.push(opName);
                        return result;
                    }
                    throw new Error(`Invalid literal or opcode in macro: ${valStr}`);
                }

                // 自动计算 PUSH 的大小
                if (val === 0n) {
                    result.push("PUSH1 0x00"); // 兼容旧版，不用 PUSH0
                } else {
                    let hex = val.toString(16);
                    if (hex.length % 2 !== 0) hex = '0' + hex;
                    const bytes = hex.length / 2;
                    if (bytes > 32) throw new Error(`Value too large: ${valStr}`);
                    result.push(`PUSH${bytes} 0x${hex}`);
                }
            }
        } else if (ast.type === 'call') {
            // 关键：为了契合 EVM 堆栈直觉 (比如 SUB(a, b) -> a - b)
            // 必须反向压栈，先计算后面的参数，再计算前面的参数
            for (let i = ast.args.length - 1; i >= 0; i--) {
                this._flattenExpr(ast.args[i], result);
            }
            // 最后推入操作指令
            result.push(ast.name.toUpperCase());
        }
        return result;
    }

    // ==========================================
    // --- 核心编译引擎 ---
    // ==========================================

    compile(source) {
        // 1. 预处理：去注释、去空行
        const rawLines = source.split('\n')
            .map(line => line.split(';')[0].trim()) // 支持 ; 号注释
            .map(line => line.split('//')[0].trim()) // 支持 // 注释
            .filter(line => line.length > 0);

        // 2. 宏展开 (Pass 0)
        // 将混合语法的 M 表达式全部“拍扁”成标准的基础指令流
        const flatLines = [];
        for (const line of rawLines) {
            if (line.endsWith(':')) {
                flatLines.push(line); // 标签保留
            } else if (line.includes('(')) {
                // 识别为 M 表达式，进行展开
                const tokens = this._tokenize(line);
                const ast = this._parseExpr(tokens);
                const expanded = this._flattenExpr(ast);
                flatLines.push(...expanded);
            } else {
                // 纯原生指令保留 (如 PUSH1 0x42)
                flatLines.push(line); 
            }
        }

        // --- 3. 第一遍扫描：计算标签位置 (Pass 1) ---
        const labels = {}; 
        let byteOffset = 0;
        const parsedLines = [];

        for (const line of flatLines) {
            if (line.endsWith(':')) {
                const labelName = line.slice(0, -1).trim();
                if (labels[labelName] !== undefined) throw new Error(`Duplicate label: ${labelName}`);
                labels[labelName] = byteOffset;
                continue; 
            }

            const parts = line.split(/\s+/);
            const opName = parts[0].toUpperCase();
            const opCode = this.opcodes[opName];
            
            if (opCode === undefined) throw new Error(`Unknown opcode: ${opName}`);

            let size = 1; 
            let arg = null;
            let argSize = 0;

            if (opName.startsWith('PUSH') && opName !== 'PUSH0') {
                argSize = parseInt(opName.slice(4)); 
                if (isNaN(argSize) || argSize < 1 || argSize > 32) throw new Error(`Invalid PUSH: ${opName}`);
                size += argSize; 
                arg = parts[1];  
                if (!arg) throw new Error(`${opName} missing argument`);
            }

            parsedLines.push({ opName, opCode, arg, argSize });
            byteOffset += size;
        }

        // --- 4. 第二遍扫描：生成最终字节码 (Pass 2) ---
        const bytes = [];

        for (const instr of parsedLines) {
            bytes.push(instr.opCode);

            if (instr.arg !== null) {
                let val;
                if (instr.arg.startsWith('@')) {
                    const labelName = instr.arg.slice(1);
                    const targetOffset = labels[labelName];
                    if (targetOffset === undefined) throw new Error(`Undefined label: ${labelName}`);
                    val = BigInt(targetOffset);
                } else {
                    try { val = BigInt(instr.arg); } 
                    catch (e) { throw new Error(`Invalid value: ${instr.arg}`); }
                }

                const maxVal = (1n << (BigInt(instr.argSize) * 8n)) - 1n;
                if (val > maxVal || val < 0n) throw new Error(`Value out of range for ${instr.opName}`);

                for (let i = instr.argSize - 1; i >= 0; i--) {
                    const byte = Number((val >> BigInt(i * 8)) & 0xFFn);
                    bytes.push(byte);
                }
            }
        }
        
        return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // --- 反汇编保持原样 ---
    disassemble(bytecode) {
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
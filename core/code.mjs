import { toHex } from '../common/utils.mjs';

export class Code {
    constructor(hexBytecode) {
        this.bytes = hexBytecode; // 假设传入的已经是 Uint8Array
        this.pc = 0;
        
        // 构造时立即进行静态分析，建立合法的跳转目标表
        this.validJumps = this._analyzeJumpDests();
    }

    /**
     * 静态分析：扫描所有 JUMPDEST (0x5B)，同时跳过 PUSH 的数据部分
     * 防止由数据伪造的 JUMPDEST
     */
    _analyzeJumpDests() {
        const dests = new Set();
        let i = 0;
        while (i < this.bytes.length) {
            const op = this.bytes[i];
            
            if (op === 0x5B) { // JUMPDEST
                dests.add(i);
                i++;
            } 
            else if (op >= 0x60 && op <= 0x7F) { // PUSH1 (0x60) ~ PUSH32 (0x7F)
                const dataSize = op - 0x5F;
                i += 1 + dataSize; // 跳过 Opcode + 数据
            } 
            else {
                i++;
            }
        }
        return dests;
    }

    get isFinished() {
        return this.pc >= this.bytes.length;
    }

    get currentPc() {
        return this.pc;
    }

    /**
     * 读取下一个 Opcode，PC 自动 +1
     */
    readOp() {
        if (this.pc >= this.bytes.length) return 0x00; // STOP
        return this.bytes[this.pc++];
    }

    /**
     * 读取接下来的 n 个字节，PC 自动 +n
     * 用于 PUSH 指令
     */
    readBytes(n) {
        if (this.pc + n > this.bytes.length) {
            throw new Error("Code out of bounds during PUSH");
        }
        
        let val = 0n;
        // 大端序读取 (Big-Endian)
        for (let i = 0; i < n; i++) {
            val = (val << 8n) | BigInt(this.bytes[this.pc++]);
        }
        return val;
    }

    /**
     * 执行跳转
     * @param {BigInt} dest 目标 PC 地址
     */
    jump(dest) {
        const destNum = Number(dest);
        if (!this.validJumps.has(destNum)) {
            throw new Error(`Invalid JUMPDEST at ${toHex(dest)}`);
        }
        this.pc = destNum;
    }
}
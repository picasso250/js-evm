import { toHex } from '../common/utils.mjs';

export class Memory {
    constructor() {
        this.buffer = new Uint8Array(0);
    }

    /**
     * 确保内存空间足够，不足则扩容 (以 32 字节为单位对齐)
     */
    extend(offset, size) {
        if (size === 0) return;
        const newSize = offset + size;
        if (newSize > this.buffer.length) {
            const alignedSize = Math.ceil(newSize / 32) * 32;
            const newBuffer = new Uint8Array(alignedSize);
            newBuffer.set(this.buffer);
            this.buffer = newBuffer;
        }
    }

    /**
     * MSTORE: 存入 64位 (8字节) Word
     */
    store(offset, value) {
        this.extend(offset, 8);
        for (let i = 0; i < 8; i++) {
            const byte = Number((value >> BigInt((7 - i) * 8)) & 0xffn);
            this.buffer[offset + i] = byte;
        }
    }

    /**
     * MLOAD: 读取 64位 (8字节) Word
     */
    load(offset) {
        this.extend(offset, 8);
        let value = 0n;
        for (let i = 0; i < 8; i++) {
            value = (value << 8n) | BigInt(this.buffer[offset + i]);
        }
        return value;
    }
    
    store8(offset, value) {
        this.extend(offset, 1);
        this.buffer[offset] = Number(value & 0xffn);
    }

    copy(dest, src, length) {
        if (length <= 0) return;
        const maxOffset = Math.max(dest + length, src + length);
        this.extend(0, maxOffset);
        const chunk = this.buffer.slice(src, src + length);
        this.buffer.set(chunk, dest);
    }

    size() {
        return this.buffer.length;
    }
}
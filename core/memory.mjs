import { toHex, calcMemoryCost } from '../common/utils.mjs';

export class Memory {
    constructor() {
        this.buffer = new Uint8Array(0);
        this.activeWords = 0n;
    }

    expand(offset, size) {
        if (size === 0) return 0n;
        
        const end = offset + size;
        const newWords = BigInt(Math.ceil(end / 32));

        if (newWords <= this.activeWords) {
            return 0n;
        }

        const newCost = calcMemoryCost(newWords);
        const currentCost = calcMemoryCost(this.activeWords);
        const cost = newCost - currentCost;

        this.activeWords = newWords;
        this._resizeBuffer(Number(newWords * 32n));

        return cost;
    }

    _resizeBuffer(newSize) {
        if (newSize > this.buffer.length) {
            const newBuffer = new Uint8Array(newSize);
            newBuffer.set(this.buffer);
            this.buffer = newBuffer;
        }
    }

    store(offset, value) {
        for (let i = 0; i < 8; i++) {
            const byte = Number((value >> BigInt((7 - i) * 8)) & 0xffn);
            this.buffer[offset + i] = byte;
        }
    }

    load(offset) {
        if (offset + 8 > this.buffer.length) {
            return 0n;
        }
        let value = 0n;
        for (let i = 0; i < 8; i++) {
            value = (value << 8n) | BigInt(this.buffer[offset + i]);
        }
        return value;
    }
    
    store8(offset, value) {
        this.buffer[offset] = Number(value & 0xffn);
    }

    copy(dest, src, length) {
        if (length <= 0) return;
        const chunk = this.buffer.slice(src, src + length);
        if (chunk.length < length) {
            const padded = new Uint8Array(length);
            padded.set(chunk);
            this.buffer.set(padded, dest);
        } else {
            this.buffer.set(chunk, dest);
        }
    }

    slice(offset, length) {
        if (length <= 0) return new Uint8Array(0);
        const end = offset + length;
        if (end > this.buffer.length) {
            const padded = new Uint8Array(length);
            padded.set(this.buffer.slice(offset));
            return padded;
        }
        return this.buffer.slice(offset, end);
    }

    size() {
        return this.buffer.length;
    }
}

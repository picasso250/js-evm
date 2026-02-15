export const toHex = (val) => {
    // 处理 BigInt 和 Number，保持 trace 输出整洁
    if (typeof val === 'bigint') {
        return '0x' + val.toString(16);
    }
    return '0x' + val.toString(16);
};

export const parseCode = (hexString) => {
    if (!hexString) return new Uint8Array(0);
    let hex = hexString.trim();
    if (hex.startsWith('0x')) hex = hex.slice(2);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
};

// 64位无符号截断
export const toU64 = (val) => BigInt.asUintN(64, val);

// 64位有符号截断 (用于 SDIV, SLT 等)
export const toS64 = (val) => BigInt.asIntN(64, val);

// 计算内存消耗的总 Gas
// words: 32字节为 1 word
export const calcMemoryCost = (words) => {
    const w = BigInt(words);
    return 3n * w + (w * w) / 512n;
};

// 计算数据复制的 Gas (用于 MCOPY, CALLDATACOPY 等)
// 公式: 3 * ceil(bytes / 32)
export const calcCopyCost = (byteLength) => {
    const length = BigInt(byteLength);
    if (length === 0n) return 0n;
    const words = (length + 31n) / 32n;
    return 3n * words;
};
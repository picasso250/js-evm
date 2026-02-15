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
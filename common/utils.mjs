export const toHex = (bigIntVal) => '0x' + bigIntVal.toString(16);

export const toU64 = (bigIntVal) => BigInt.asUintN(64, bigIntVal);

export const parseCode = (hexString) => {
    if (hexString.startsWith('0x')) hexString = hexString.slice(2);
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
};

export const hexToBytes = (hexString) => parseCode(hexString);

export const bytesToHex = (bytes) => {
    return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

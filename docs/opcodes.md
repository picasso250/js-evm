# EVM Opcodes

Source: [ethereum.org](https://ethereum.org/en/developers/docs/evm/opcodes/)

This is an updated version of the EVM reference page at [wolflo/evm-opcodes](https://github.com/wolflo/evm-opcodes). Also drawn from the [Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf), the [Jello Paper](https://jellopaper.org/evm/), and the [geth](https://github.com/ethereum/go-ethereum) implementation.

For operations with dynamic gas costs, see [gas.md](https://github.com/wolflo/evm-opcodes/blob/main/gas.md).

For an interactive reference, check out [evm.codes](https://www.evm.codes/).

## Arithmetic Operations

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0x00 | STOP | 0 | Halt execution |
| 0x01 | ADD | 3 | (u)int256 addition modulo 2**256 |
| 0x02 | MUL | 5 | (u)int256 multiplication modulo 2**256 |
| 0x03 | SUB | 3 | (u)int256 subtraction modulo 2**256 |
| 0x04 | DIV | 5 | uint256 division |
| 0x05 | SDIV | 5 | int256 division |
| 0x06 | MOD | 5 | uint256 modulus |
| 0x07 | SMOD | 5 | int256 modulus |
| 0x08 | ADDMOD | 8 | (u)int256 addition modulo N |
| 0x09 | MULMOD | 8 | (u)int256 multiplication modulo N |
| 0x0A | EXP | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a1-exp) | uint256 exponentiation modulo 2**256 |
| 0x0B | SIGNEXTEND | 5 | Sign extend x from (b+1) bytes to 32 bytes |

## Comparison & Bitwise Operations

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0x10 | LT | 3 | uint256 less-than |
| 0x11 | GT | 3 | uint256 greater-than |
| 0x12 | SLT | 3 | int256 less-than |
| 0x13 | SGT | 3 | int256 greater-than |
| 0x14 | EQ | 3 | (u)int256 equality |
| 0x15 | ISZERO | 3 | (u)int256 iszero |
| 0x16 | AND | 3 | Bitwise AND |
| 0x17 | OR | 3 | Bitwise OR |
| 0x18 | XOR | 3 | Bitwise XOR |
| 0x19 | NOT | 3 | Bitwise NOT |
| 0x1A | BYTE | 3 | ith byte of (u)int256 x, from the left |
| 0x1B | SHL | 3 | Shift left |
| 0x1C | SHR | 3 | Logical shift right |
| 0x1D | SAR | 3 | Arithmetic shift right |

## Cryptographic Operations

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0x20 | KECCAK256 | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a2-sha3) | keccak256 |

## Environmental Information

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0x30 | ADDRESS | 2 | address(this) |
| 0x31 | BALANCE | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a5-balance-extcodesize-extcodehash) | addr.balance |
| 0x32 | ORIGIN | 2 | tx.origin |
| 0x33 | CALLER | 2 | msg.sender |
| 0x34 | CALLVALUE | 2 | msg.value |
| 0x35 | CALLDATALOAD | 3 | msg.data[idx:idx+32] |
| 0x36 | CALLDATASIZE | 2 | len(msg.data) |
| 0x37 | CALLDATACOPY | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a3-copy-operations) | Copy msg data |
| 0x38 | CODESIZE | 2 | len(this.code) |
| 0x39 | CODECOPY | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a3-copy-operations) | Copy this contract's code |
| 0x3A | GASPRICE | 2 | tx.gasprice |
| 0x3B | EXTCODESIZE | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a5-balance-extcodesize-extcodehash) | Size of code at addr |
| 0x3C | EXTCODECOPY | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a4-extcodecopy) | Copy code from addr |
| 0x3D | RETURNDATASIZE | 2 | Size of returned data |
| 0x3E | RETURNDATACOPY | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a3-copy-operations) | Copy returned data |
| 0x3F | EXTCODEHASH | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a5-balance-extcodesize-extcodehash) | Hash of code at addr |

## Block Information

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0x40 | BLOCKHASH | 20 | blockHash(blockNum) |
| 0x41 | COINBASE | 2 | block.coinbase |
| 0x42 | TIMESTAMP | 2 | block.timestamp |
| 0x43 | NUMBER | 2 | block.number |
| 0x44 | PREVRANDAO | 2 | block.prevrandao |
| 0x45 | GASLIMIT | 2 | block.gaslimit |
| 0x46 | CHAINID | 2 | chain_id |
| 0x47 | SELFBALANCE | 5 | address(this).balance |
| 0x48 | BASEFEE | 2 | block.basefee |
| 0x49 | BLOBHASH | 3 | tx.blob_versioned_hashes[idx] |
| 0x4A | BLOBBASEFEE | 2 | block.blobbasefee |

## Memory Operations

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0x50 | POP | 2 | Remove item from top of stack |
| 0x51 | MLOAD | 3+ | Read word from memory |
| 0x52 | MSTORE | 3+ | Write word to memory |
| 0x53 | MSTORE8 | 3+ | Write single byte to memory |
| 0x59 | MSIZE | 2 | Size of memory in bytes |
| 0x5E | MCOPY | 3+ | Copy memory |

## Storage Operations

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0x54 | SLOAD | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a6-sload) | Read word from storage |
| 0x55 | SSTORE | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a7-sstore) | Write word to storage |
| 0x5C | TLOAD | 100 | Read word from transient storage |
| 0x5D | TSTORE | 100 | Write word to transient storage |

## Control Flow

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0x56 | JUMP | 8 | pc := dst |
| 0x57 | JUMPI | 10 | pc := condition ? dst : pc + 1 |
| 0x58 | PC | 2 | Program counter |
| 0x5B | JUMPDEST | 1 | Mark valid jump destination |

## Stack Operations

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0x5F | PUSH0 | 2 | Push constant value 0 |
| 0x60 | PUSH1 | 3 | Push 1-byte value |
| 0x61 | PUSH2 | 3 | Push 2-byte value |
| ... | ... | ... | ... |
| 0x7F | PUSH32 | 3 | Push 32-byte value |
| 0x80 | DUP1 | 3 | Clone 1st value |
| 0x81 | DUP2 | 3 | Clone 2nd value |
| ... | ... | ... | ... |
| 0x8F | DUP16 | 3 | Clone 16th value |
| 0x90 | SWAP1 | 3 | Swap 1st and 2nd |
| 0x91 | SWAP2 | 3 | Swap 1st and 3rd |
| ... | ... | ... | ... |
| 0x9F | SWAP16 | 3 | Swap 1st and 17th |

## Logging

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0xA0 | LOG0 | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a8-log-operations) | LOG0(memory[ost:ost+len-1]) |
| 0xA1 | LOG1 | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a8-log-operations) | LOG1 with topic0 |
| 0xA2 | LOG2 | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a8-log-operations) | LOG2 with topic0, topic1 |
| 0xA3 | LOG3 | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a8-log-operations) | LOG3 with topic0, topic1, topic2 |
| 0xA4 | LOG4 | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a8-log-operations) | LOG4 with topic0, topic1, topic2, topic3 |

## Contract Creation

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0xF0 | CREATE | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a9-create-operations) | Create new contract |
| 0xF5 | CREATE2 | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a9-create-operations) | Create new contract with salt |

## Calls

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0xF1 | CALL | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#aa-call-operations) | Call another contract |
| 0xF2 | CALLCODE | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#aa-call-operations) | Call with same code |
| 0xF4 | DELEGATECALL | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#aa-call-operations) | Delegate call |
| 0xFA | STATICCALL | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#aa-call-operations) | Static call |

## Return Operations

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0xF3 | RETURN | 0+ | Return mem[ost:ost+len-1] |
| 0xFD | REVERT | 0+ | Revert with mem[ost:ost+len-1] |

## Invalid & SELFDESTRUCT

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0xFE | INVALID | 0 | Invalid instruction |
| 0xFF | SELFDESTRUCT | [dynamic](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#ab-selfdestruct) | Halt and send balance |

## Gas Operations

| Stack | Name | Gas | Description |
|-------|------|-----|-------------|
| 0x5A | GAS | 2 | gasRemaining |

## Notes

- Memory expansion gas: see [gas.md](https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a0-1-memory-expansion)
- All arithmetic is modulo 2^256 for uint256
- Stack values are 256-bit (32 bytes)
- PUSH1-PUSH32 push 1-32 bytes onto the stack
- DUP1-DUP16 duplicate stack items
- SWAP1-SWAP16 swap stack items

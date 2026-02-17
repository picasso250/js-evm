; 1. 计算 1 + 2
PUSH1 1
PUSH1 2
ADD         ; Stack: [3]

; 2. 将结果写入内存 (MSTORE)
; 标准 EVM 的 RETURN 读取的是内存，所以必须先存
PUSH1 0     ; 内存偏移量 offset = 0
MSTORE      ; Stack: [] -> Memory[0..7] = 0x00...03 (64位下存8字节)

; 3. 执行 RETURN
PUSH1 8     ; 长度 length = 8 字节 (一个 64位 Word)
PUSH1 0     ; 偏移量 offset = 0
RETURN      ; 返回 Memory[0] 开始的 8 个字节
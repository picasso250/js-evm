import subprocess
import json
import sys
import os

# --- 配置 ---

# 你的 Node.js EVM 路径 (根据你的实际路径调整)
MY_EVM_CMD = ["node", "./app/evm64-cli.mjs", "run", "--trace"]

# 官方 Geth EVM 命令 (确保 'evm' 在系统 PATH 中)
OFFICIAL_EVM_CMD = ["evm", "run", "--trace"]

# 颜色代码
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"

# --- 测试用例 (Opcode -> Bytecode) ---
# 格式: Name: (Description, Bytecode)
# 注意：大部分测试用例都最后加了 00 (STOP)，以便抓取最终堆栈
TEST_CASES = {
    # Arithmetic
    "ADD": ("3 + 2", "600360020100"),  # PUSH 3, PUSH 2, ADD
    "MUL": ("4 * 3", "600460030200"),  # PUSH 4, PUSH 3, MUL
    "SUB": ("5 - 2", "600560020300"),  # PUSH 5, PUSH 2, SUB (Normal)
    "SUB_NEG": (
        "2 - 5 (Underflow)",
        "600260050300",
    ),  # PUSH 2, PUSH 5, SUB (Expect Diff: 64bit vs 256bit wrap)
    "DIV": ("10 / 2", "600a60020400"),  # PUSH 10, PUSH 2, DIV
    "SDIV": (
        "-10 / 2",
        "600260f60500",
    ),  # PUSH 2, PUSH -10 (byte 0xf6 is -10 signed?), tricky in pure hex. Let's stick to simple positives for now.
    "MOD": ("10 % 3", "600a60030600"),  # PUSH 10, PUSH 3, MOD
    "ADDMOD": ("(10+10)%3", "6003600a600a0800"),  # PUSH 3, PUSH 10, PUSH 10, ADDMOD
    "MULMOD": ("(10*10)%3", "6003600a600a0900"),  # PUSH 3, PUSH 10, PUSH 10, MULMOD
    "EXP": ("2 ** 3", "600360020a00"),  # PUSH 3, PUSH 2, EXP
    # Comparison
    "LT": (
        "2 < 3",
        "600260031000",
    ),  # PUSH 2, PUSH 3, LT -> 0 (because stack is [3, 2], 3 < 2 is false)
    "GT": ("2 > 3", "600260031100"),  # 3 > 2 -> 1
    "SLT": ("2 < 3 (Signed)", "600260031200"),
    "SGT": ("2 > 3 (Signed)", "600260031300"),
    "EQ": ("3 == 3", "600360031400"),  # PUSH 3, PUSH 3, EQ
    "ISZERO": ("ISZERO(0)", "60001500"),  # PUSH 0, ISZERO
    # Bitwise
    "AND": ("0x0F & 0xF0", "600f60f01600"),
    "OR": ("0x0F | 0xF0", "600f60f01700"),
    "XOR": ("0x0F ^ 0xFF", "600f60ff1800"),
    "NOT": ("NOT(0)", "60001900"),  # Expect Diff (All Fs)
    "BYTE": ("Get byte 31 of word", "601f60ff1a00"),  # PUSH 31 (0x1f), PUSH 255, BYTE
    "SHL": ("1 << 2", "600260011b00"),  # PUSH 2, PUSH 1, SHL (val << shift) -> 1 << 2
    "SHR": ("4 >> 1", "600460011c00"),  # PUSH 4, PUSH 1, SHR
    "SAR": ("4 >> 1 (Arith)", "600460011d00"),
}


def clean_hex(hex_str):
    """标准化 hex 字符串: 移除 0x, 转小写, 移除前导零 (便于比较数值)"""
    if not hex_str:
        return "0"
    s = hex_str.lower().replace("0x", "")
    return s.lstrip("0") or "0"


def run_evm(cmd_prefix, bytecode):
    """运行 EVM 命令并提取最终 Stack"""
    full_cmd = cmd_prefix + [bytecode]

    try:
        # 你的 cli 可能在 windows 上需要 shell=True，或者不需要，视环境而定
        # 这里为了兼容 list 形式传参，shell=True 在 windows 上有时需要把 cmd 拼成 string
        if os.name == "nt":
            # Windows workaround
            result = subprocess.run(
                " ".join(full_cmd), capture_output=True, text=True, shell=True
            )
        else:
            result = subprocess.run(full_cmd, capture_output=True, text=True)

        if result.returncode != 0:
            return None, f"Error: {result.stderr}"

        lines = result.stderr.strip().split("\n")
        last_stack = []

        # 解析 JSON 输出，寻找最后一条指令的 Stack 状态
        # Trace 通常是指令执行 *前* 的状态。
        # 我们寻找 'opName': 'STOP' 的那一行，它的 'stack' 字段即为最终结果。
        # 如果没有 STOP，取最后一行含 stack 的。

        found_stop = False
        for line in lines:
            try:
                data = json.loads(line)
                if "stack" in data:
                    last_stack = data["stack"]
                    if data.get("opName") == "STOP":
                        found_stop = True
                        break  # 找到 STOP 就结束
            except json.JSONDecodeError:
                continue

        return last_stack, None

    except Exception as e:
        return None, str(e)


def compare_stacks(stack_my, stack_ref):
    """比较两个栈是否逻辑相等"""
    if len(stack_my) != len(stack_ref):
        return False

    for v1, v2 in zip(stack_my, stack_ref):
        if clean_hex(v1) != clean_hex(v2):
            return False
    return True


def main():
    print(f"{'OPCODE':<10} | {'RESULT':<8} | {'DETAILS'}")
    print("-" * 60)

    for op_name, (desc, bytecode) in TEST_CASES.items():
        # 1. 运行我的 EVM
        my_stack, my_err = run_evm(MY_EVM_CMD, bytecode)

        # 2. 运行官方 EVM
        ref_stack, ref_err = run_evm(OFFICIAL_EVM_CMD, bytecode)

        if my_err:
            print(f"{op_name:<10} | {RED}ERR(MY){RESET} | {my_err}")
            continue
        if ref_err:
            print(f"{op_name:<10} | {RED}ERR(REF){RESET} | {ref_err}")
            continue

        # 3. 比较
        is_match = compare_stacks(my_stack, ref_stack)

        if is_match:
            print(f"{op_name:<10} | {GREEN}PASS{RESET}     | {desc}")
        else:
            print(f"{op_name:<10} | {YELLOW}DIFF{RESET}     | {desc}")
            print(f"  {YELLOW}My Stack :{RESET} {my_stack}")
            print(f"  {YELLOW}Ref Stack:{RESET} {ref_stack}")
            print("")


if __name__ == "__main__":
    main()

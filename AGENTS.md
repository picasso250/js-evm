测试时，总是运行  evm run --trace 60xx00 来看看是否和官方实现是否一致！
新增指令时，除了 core\evm64-core.mjs 也不要忘记编译器 core\compiler.mjs 的更新
二元操作顺序 比如 sub:  a=pop() ; b=pop(); r = a - b   都是 a op b
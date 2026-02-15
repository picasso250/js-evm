js版本的evm，64位，而非256位
二元操作顺序 比如 sub:  a=pop() ; b=pop(); r = a - b
cli和html版本都有
输出模仿go版本evm的--trace格式

> evm run --trace 6002600300  
{"pc":0,"op":96,"gas":"0x2540be400","gasCost":"0x3","memSize":0,"stack":[],"depth":1,"refund":0,"opName":"PUSH1"}
{"pc":2,"op":96,"gas":"0x2540be3fd","gasCost":"0x3","memSize":0,"stack":["0x2"],"depth":1,"refund":0,"opName":"PUSH1"}{"pc":4,"op":0,"gas":"0x2540be3fa","gasCost":"0x0","memSize":0,"stack":["0x2","0x3"],"depth":1,"refund":0,"opName":"STOP"}
{"output":"","gasUsed":"0x6"}


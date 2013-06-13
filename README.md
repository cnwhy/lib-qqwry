QQwry
=====

用NodeJS解析纯真IP库(QQwry.dat)
请将QQwry.dat文件放在同相同目录下测试

1. index.js 解析IP库的主文件;
2. app.js 测试示例;

### 初始化方法 info(dataPath,callback)
dataPath : IP库路径 //默认路径为主文件同目录下(__dirname + "/qqwry.dat");
callback : 回调函数 //可在此时调用查询函数

### 查询函数 SearchIPLocation(IP)
IP : IP地址
return {Country:{String},Area:{Stirng},ip:{String}; //反回一个JSON对像;

### 测试代码
node app.js 255.255.255.255

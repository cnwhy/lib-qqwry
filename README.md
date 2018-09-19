# lib-qqwry

`lib-qqwry`是一个高效查询纯真IP库(qqwry.dat)的模块;  

### 实现的功能
1. 通过IP地址或有效的IP数值,搜索IP地址对应的地理位置信息。  
2. 搜索一个IP段的地理位置信息。  
3. IP地址与数值的互转。  

### 安装
```
npm install lib-qqwry
```

### 使用

```js
var libqqwry = require('lib-qqwry');
var qqwry = libqqwry() //初始化IP库解析器
    .qqwry.speed(); //启用急速模式 比不开启效率率快非常多 但多占10M左右内存;
var ip1 = qqwry.searchIP("202.103.102.10"); //查询IP信息
var ips = qqwry.searchIPScope("0.0.0.0","1.0.0.0");  //查询IP段信息
//异步查询IP段信息
qqwry.searchIPScope("0.0.0.0","1.0.0.0",function(err,iparr){
  console.log(iparr);
});
```

## API

### libqqwry.ipToInt(IP) IP地址转数值
```
> libqqwry.ipToInt("255.255.255.255")
4294967295
```

### libqqwry.intToIP(INT) 数值转IP地址
```
> libqqwry.intToIP(4294967295)
'255.255.255.255'
```

### libqqwry.ipEndianChange(INT) 字节序转换
按32位转换参数的字节序  
一些云平台的环境变量中IP信息可能是Little-Endian形式的数值; 

```
> libqqwry.ipEndianChange(0x010000FF)
4278190081 //0xFF000001
```

### new libqqwry(speed,dataPath) 实例化一个IP库解析器对像(Qqwry)
speed : 是否开启急速模式,可选; //默认false;
dataPath : IP库路径,可选; //默认路径为data文件夹中(__dirname + "/data/qqwry.dat");
// 可以简写为 libqqwry(speed,dataPath)
```js
var libqqwry = require('lib-qqwry');
var qqwry = libqqwry(true);
```
*libqqwry(), libqqwry.init()* 功能相同

## 解析器对像 Qqwry
### qqwry.searchIP(IP) 单个IP查询
IP : IP地址/IP数值
反回一个JSON对像;  
```
> qqwry.searchIP("255.255.255.255");
{ int: 4294967040,
  ip: '255.255.255.0',
  Country: '纯真网络',
  Area: '2015年5月30日IP数据' }
```

### qqwry.searchIPScope(beginIP,endIP,callback) IP段查询
beginIP : 启始IP  
endIP : 结束IP  
callback: 回调函数,不传则为同步查询 function(err,arrdata){};  
```
> qqwry.searchIPScope("8.8.8.0","8.8.8.8");
[ { begInt: 134744064,
    endInt: 134744071,
    begIP: '8.8.8.0',
    endIP: '8.8.8.7',
    Country: '美国',
    Area: '加利福尼亚州圣克拉拉县山景市谷歌公司' },
  { begInt: 134744072,
    endInt: 134744072,
    begIP: '8.8.8.8',
    endIP: '8.8.8.8',
    Country: '美国',
    Area: '加利福尼亚州圣克拉拉县山景市谷歌公司DNS服务器' } ]
```

### qqwry.speed() 启用急速模式
急速模式实质为将IP库文件读入内存中以提升效率, 是普通模式特别是HDD硬盘环境快50倍以上.

### qqwry.unSpeed() 停用急速模式

## 文档说明
1. ./data/qqwry.dat  默认IP库,可用最新IP库替换; 下载地址[www.cz88.net](http://www.cz88.net/)
2. ./lib/qqwry.js  解析IP库的主文件;
3. ./lib/gbk.js  GBK编码表文件,从[iconv-lite](https://github.com/ashtuchkin/iconv-lite)中找出来的,并增加了一个转码方法;
4. ./test/demo.js  使用演示;
5. ./test/test_v.js  效率测试示例;

### 效率测试文件 test_v.js
`node test_v.js 255.255.255.255` 正常工作检查  
`node test_v.js -1` 单个查询效率测试  
`node test_v.js -2` 10次IP段查询效率测试  
`node test_v.js -3` 10次IP段异步查询效率测试  
lib-qqwry  (轻量级版本开发分支)
=====

lib-qqwry是一个高效查询纯真IP库(qqwry.dat)的模块;  
为更好的字符转化效率,未使用iconv模块,直接使用gbk编码表文件。  
经过不断优化，相同环境下，单次查询速度从最初的0.6毫秒提升到现在的0.004毫秒;  

### 实现的功能
1. 通过IP地址或有效的IP数值,搜索IP地址对应的地理位置信息。  
2. 搜索一个IP段的地理位置信息。  
3. IP地址与数值的互转。

### 关于轻量级版本
1. 本分支增加了一个配置文件.
2. 不再需要初始化方法(并未取消info方法)在调用查询时,首先自动判断并执行初始化.
3. 程序内不再抛出错误.
4. 空闲指定时间后,程序自动清理占用的内存.

### npm安装
轻量级版不会发布到npm,请自行下载或用Git安装
<pre>

</pre>


### 调用方法
<pre>
var qqwry = require('lib-qqwry'); //调用lib-qqwry ;
var ipL = qqwry.searchIP("202.103.102.10"); //查询IP信息
var ipLA = qqwry.searchIPScope("0.0.0.0","1.0.0.0");  //查询IP段信息
</pre>

## API

### searchIP(IP) 单个IP查询
IP : IP地址  
反回一个JSON对像;  
<pre>
> qqwry.searchIP("255.255.255.255");
{ ip: '255.255.255.255',
  Country: '纯真网络',
  Area: '2013年6月10日IP数据' }
</pre>

### searchIPScope(beginIP,endIP) IP段查询
beginIP : 启始IP  
endIP : 结束IP  
反回一个JSON对像数组;  
<pre>
> qqwry.searchIPScope("0.0.0.0","1.0.0.0");
[ { begIP: '0.0.0.0',
    endIP: '0.255.255.255',
    Country: 'IANA保留地址',
    Area: ' CZ88.NET' },
  { begIP: '1.0.0.0',
    endIP: '1.0.0.255',
    Country: '澳大利亚',
    Area: ' CZ88.NET' } ]
</pre>

### searchIPScopeAsync(beginIP,endIP,callback) IP段查询的异步方法
searchIPScope() 的异步方法,查询结果会以第一个参数的形式传给回调函数;  


### DBUG(Bool) 调试模式开关,默认未启用
DUBG模式会在控制台输出查询的关键信息,方便定位错误;
<pre>
var qqwry = require('lib-qqwry').DBUG().info(); //开启调试模式并初始化
qqrry.DBUG(false); //关闭调试模式;
</pre>

### ipToInt(IP) IP地址转数值
<pre>
> qqwry.ipToInt("255.255.255.255")
4294967295
</pre>

### intToIP(INT) 数值转IP地址
<pre>
> qqwry.intToIP(4294967295)
'255.255.255.255'
</pre>

### ipEndianChange(INT) 字节序转换
按32位转换参数的字节序  
一些云平台的环境变量中IP信息可能是Little-Endian形式的数值;  
比如百度node.js环境中的 `process.env.BAE_ENV_COOKIE_IP` , 这时候就有用了;
<pre>
> qqwry.ipEndianChange(0x010000FF)
4278190081 //0xFF000001
</pre>

## 文档说明
1. index.js 解析IP库的主文件;
2. gbk.js 	GBK编码表文件,从[iconv-lite](https://github.com/ashtuchkin/iconv-lite)中找出来的,并增加了一个转码方法;
3. test.js	调用演示;
4. test_v.js 效率测试示例;
5. qqwry.dat 纯真IP库,可用最新IP库替换;

### 效率测试文件 test_v.js
`node test_v.js 255.255.255.255` 正常工作检查  
`node test_v.js -1` 单个查询效率测试  
`node test_v.js -2` IP段查询效率测试  

##作者
[含浪](http://www.cnblogs.com/whyoop)   w.why@163.com



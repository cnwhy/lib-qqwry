var Qqwry = require('../index.js');
var path = require('path');
var dp = path.join(__dirname,"../data/qqwry.dat");
var qqwry = Qqwry.init().speed(); // Qqwry.init() <=> Qqwry()

var ip1 = qqwry.searchIP("0.0.255.0"),
	ip2 = qqwry.searchIP(0xFFFFFF00);
	ips = qqwry.searchIPScope("8.8.8.0","8.8.8.9"); //IP 段查询
console.log(ip1);
console.log(ip2);
console.log(ips);
console.log("-----end-----");
//异步IP段查询；
qqwry.searchIPScope("8.8.8.0","8.8.8.8",function(err,iparr){
	if(err) return console.error(err);
	console.log(iparr);
});

return; 

//init 参数测试
var qqwry1 = Qqwry.init(true)
var qqwry2 = Qqwry.init(dp)
var qqwry3 = Qqwry.init(dp,true)
var qqwry4 = Qqwry.init(true,dp)
var v = qqwry.searchIP("255.255.255.255");
var v1 = qqwry1.searchIP("255.255.255.255");
var v2 = qqwry2.searchIP("255.255.255.255");
var v3 = qqwry3.searchIP("255.255.255.255");
var v4 = qqwry4.searchIP("255.255.255.255");
console.log([v,v1,v2,v3,v4].map(v=>v.Area).join('\n'));
var Qqwry = require('../index.js');

qqwry = Qqwry.init(); // Qqwry.init() <=> Qqwry()

var ip1 = qqwry.searchIP("0.0.255.0"),
	ip2 = qqwry.searchIP(0xFFFFFF00);
	ips = qqwry.searchIPScope("8.8.8.0","8.8.8.9"); //IP 段查询
//异步IP段查询；
qqwry.searchIPScope("8.8.8.0","8.8.8.8",function(err,iparr){
	if(err) return console.error(err);
	console.log(iparr);
});

console.log(ip1);
console.log(ip2);
console.log(ips);
console.log("-----end-----");

//异步初始化调用
// qqwry.infoAsync(function(){
	// console.log(qqwry.searchIPLocation("255.255.255.255"));
	// console.log(qqwry.searchIPLocation(0xFFFFFF00));
// })
//console.log("-----end-----");
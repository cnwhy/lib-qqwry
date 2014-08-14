var qqwry = require('../index.js').info();

var ip1 = qqwry.searchIP("0.0.255.0"),
	ip2 = qqwry.searchIP(0xFFFFFF00);
	ip3 = qqwry.searchIPScope("8.8.8.0","8.8.8.9");
//异步IP段查询；
qqwry.searchIPScopeAsync("8.8.8.0","8.8.8.8",function(a){
	console.log(a);
});
console.log(ip1);
console.log(ip2);
console.log(ip3);
console.log("-----end-----");

//异步初始化调用
// qqwry.infoAsync(function(){
	// console.log(qqwry.searchIPLocation("255.255.255.255"));
	// console.log(qqwry.searchIPLocation(0xFFFFFF00));
// })
//console.log("-----end-----");
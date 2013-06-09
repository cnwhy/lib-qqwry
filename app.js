var qqwry = require('./qqwry.js');
var time1 = new Date();

/*
var fs = require("fs"),arr = [];
var rs = fs.createReadStream('./fs.js');
rs.on("data", function (trunk){
	arr.push(trunk);
})
rs.on("end",function(){
	console.log(arr);
})
*/

qqwry.info(function(){
	var arguments = process.argv.splice(2);
	if(arguments.length){
		qqwry.DBUG(false);
		for(var ips = 0 ; ips < arguments.length ; ips ++){
			var loc = qqwry.SearchIPLocation(arguments[ips]);
			console.log(loc.Country + " " + loc.Area);
		}
		return ;
	}
	qqwry.DBUG(false);
	var time_b = new Date();
	console.log("初始化耗时: "+ (time_b - time1));
	var n=0;
	for(var i = 0 ; i<1000; i++){
		qqwry.SearchIPLocation("202.103.102.10");
		qqwry.SearchIPLocation("74.125.71.0");
		qqwry.SearchIPLocation("127.0.0.1");
		qqwry.SearchIPLocation("0.0.0.0");
		qqwry.SearchIPLocation("255.255.255.255");
		qqwry.SearchIPLocation("10.10.0.1");
		qqwry.SearchIPLocation("192.168.0.1");
		qqwry.SearchIPLocation("25.111.10.15");
		qqwry.SearchIPLocation("100.131.30.111");
		qqwry.SearchIPLocation("220.211.210.10");
		n+=10;
	}
	var time2 = new Date()
	console.log("查询完成总耗时: " + (time2 - time_b) + " 平均每条记录耗时:" + ((time2 - time_b)/n));
},"dbug");
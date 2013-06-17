var t = new Date();
var qqwry = require('./index.js');

// var gbk = require('./gbk_.js');
// var gbk1 = require('./gbk_.js');
// var iconv = require('iconv-lite'); //iconv.decode(, 'GBK');
// //var gbkarr = [50, 48, 49, 51, 196, 234, 52, 212, 194, 49, 53, 200, 213, 73, 80, 202, 253, 190, 221];
// var gbkarr = [50, 128, 49, 51, 196, 234, 52, 212, 194, 49, 53, 200, 213, 73, 80, 202, 253, 190, 221];
// console.log(gbk.dc_GBK(gbkarr) + " <<<<gbk");
// console.log(gbk1.dc_GBK(gbkarr) + " <<<<gbk1");
// console.log(iconv.decode(new Buffer(gbkarr) , 'GBK') + " <<<<iconv");

//console.log(String.fromCharCode(0x20ac));

var t_jz = new Date();
qqwry.info("./data/qqwry.dat",function(){
	var arguments = process.argv.splice(2);
	if(arguments.length){
		var tt1 = new Date(),ttt;
		//qqwry.on("searchIPLocations",qqwry.searchIPLocations);
		for(var ips = 0 ; ips < arguments.length ; ips ++){
			var loc = qqwry.searchIPLocation(arguments[ips]);
			console.log(loc.ip + " -> " + loc.Country + " | " + loc.Area);
		}		
		//console.log(qqwry.searchIPLocation(0));
		//console.log(qqwry.setIPLocation(9347593));
		console.log("---------------------");
		
		var t_pl = new Date();		
		//地址段查询
		var a = qqwry.searchIPLocations(0,0x0FFFFFFF);
		console.log("------ 同步查询完毕 共"+a.length+"条数据 耗时:"+ (new Date() - t_pl) +" ------");
		
		var t_pl1 = new Date();
		//异步查询地址段
		// qqwry.emitSearchIPLocations(0,5,function(a){
			 // console.log("------1异步查询完毕 共"+a.length+"条数据 耗时:"+ (new Date() - t_pl1) +"------");
		// });
		qqwry.emitSearchIPLocations(0,0xCCFFFFFF,function(a){
			 console.log("------ 异步查询完毕 共"+a.length+"条数据 耗时:"+ (new Date() - t_pl1) +" ------");
		});
		// qqwry.emitSearchIPLocations(0,5,function(a){
			 // console.log("------3异步查询完毕 共"+a.length+"条数据 耗时:"+ (new Date() - t_pl1) +"------");
		// });
		console.log("---------------------");
		var tt2 = ttt = new Date();
		console.log("方法执行结束 耗时:" + (tt2 - tt1));
		return ;
	}
	
	qqwry.DBUG(false);
	var t1 = new Date();
	var nb=0;
	for(var i = 0 ; i<10000; i++){
		qqwry.searchIPLocation("202.103.102.10");
		qqwry.searchIPLocation("74.125.71.0");
		qqwry.searchIPLocation("127.0.0.1");
		qqwry.searchIPLocation("0.0.0.0");
		qqwry.searchIPLocation("255.255.255.255");
		qqwry.searchIPLocation("10.10.0.1");
		qqwry.searchIPLocation("192.168.0.1");
		qqwry.searchIPLocation("25.111.10.15");
		qqwry.searchIPLocation("100.131.30.111");
		qqwry.searchIPLocation("220.211.210.10");
		// console.log(qqwry.searchIPLocation("202.103.102.10"));
		// console.log(qqwry.searchIPLocation("74.125.71.0"));
		// console.log(qqwry.searchIPLocation("127.0.0.1"));
		// console.log(qqwry.searchIPLocation("0.0.0.0"));
		// console.log(qqwry.searchIPLocation("255.255.255.255"));
		// console.log(qqwry.searchIPLocation("10.10.0.1"));
		// console.log(qqwry.searchIPLocation("192.168.0.1"));
		// console.log(qqwry.searchIPLocation("25.111.10.15"));
		// console.log(qqwry.searchIPLocation("100.131.30.111"));
		// console.log(qqwry.searchIPLocation("220.211.210.10"));
		nb+=10;
	}
	var t2 = new Date()
	console.log("加载js:" + (t_jz - t) + " 初始化:" + (t1-t)  + ' 查询('+(nb/10000)+'万次):'+ (t2-t1) + " 平均:" + (t2-t1)/nb );
});
var t = new Date();
var qqwry = require('../index.js').DBUG();//加载lib-qqwry并开启DBUG模式;
var t_jz = new Date();

qqwry.info("../data/qqwry.dat",function(){
	var arg = process.argv[2],
		t1 = new Date(),n;
	console.log("加载js:" + (t_jz - t) + " 初始化:" + (t1-t));
	if(arg == "-1"){
		qqwry.DBUG(false);//关闭DEBUG模式;
		n = v1(10000);
		var t2 = new Date();
		console.log("单次查询("+(n/10000)+"万次):"+ (t2-t1) + " 平均:" + (t2-t1)/n );
	}else if(arg == "-2"){
		qqwry.DBUG(false);//关闭DEBUG模式;
		n = v2();
		var t2 = new Date();
		console.log("IP段查询"+n[0]+"次(共获取"+(n[1]/10000)+"万条记录):"+ (t2-t1) + " 平均:" + (t2-t1)/n[1] );
	}else{//验证是否正常
		var loc = qqwry.searchIP(arg || "255.255.255.255");
		console.log(loc.ip + " -> " + loc.Country + " | " + loc.Area);	
		return;
	}
});

//单个IP查询
function v1(n){
	var nb=0;
	for(var i = 0 ; i<n; i++){
		qqwry.searchIP("202.103.102.10");
		qqwry.searchIP("74.125.71.0");
		qqwry.searchIP("127.0.0.1");
		qqwry.searchIP("0.0.0.0");
		qqwry.searchIP("255.255.255.255");
		qqwry.searchIP("10.10.0.1");
		qqwry.searchIP("192.168.0.1");
		qqwry.searchIP("25.111.10.15");
		qqwry.searchIP("100.131.30.111");
		qqwry.searchIP("220.211.210.10");
		// console.log(qqwry.searchIP("202.103.102.10"));
		// console.log(qqwry.searchIP("74.125.71.0"));
		// console.log(qqwry.searchIP("127.0.0.1"));
		// console.log(qqwry.searchIP("0.0.0.0"));
		// console.log(qqwry.searchIP("255.255.255.255"));
		// console.log(qqwry.searchIP("10.10.0.1"));
		// console.log(qqwry.searchIP("192.168.0.1"));
		// console.log(qqwry.searchIP("25.111.10.15"));
		// console.log(qqwry.searchIP("100.131.30.111"));
		// console.log(qqwry.searchIP("220.211.210.10"));
		nb+=10;
	}
	return nb;
}

//IP段查询
function v2(n){
	var nb = 0,k = n || 1;
	for(var i = 0 ; i<k; i++){
		nb += qqwry.searchIPScope("0.0.0.0","0.255.255.255").length;
		nb += qqwry.searchIPScope("7.0.0.0","10.255.255.255").length;
		nb += qqwry.searchIPScope("200.255.0.0","200.255.255.255").length;
		nb += qqwry.searchIPScope("40.0.0.0","80.255.255.255").length;
		nb += qqwry.searchIPScope("180.0.0.0","240.255.255.255").length;
		nb += qqwry.searchIPScope("0.0.0.0","0.255.255.255").length;
		nb += qqwry.searchIPScope("7.0.0.0","10.255.255.255").length;
		nb += qqwry.searchIPScope("200.255.0.0","200.255.255.255").length;
		nb += qqwry.searchIPScope("40.0.0.0","80.255.255.255").length;
		nb += qqwry.searchIPScope("180.0.0.0","240.0.255.255").length;
	}
	return [k*10,nb];
}

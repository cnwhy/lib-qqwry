var libqqwry = require('../');
var qqwry1 = libqqwry();
var qqwry2 = libqqwry.init();
var arg = process.argv[2];

function openspeed(){
	qqwry1.speed();
	console.log('- 开启speed -')
}

var ips = [],ipds=[];

//随机生成100个IP
for(var i = 0; i < 100; i++){
	ips.push(Math.random() * 0xFFFFFFFF >>> 0)
}

//随机生成10个IP
for(var i =0; i<10; i++){
	var _ip = ips[i]
	ipds.push([Math.random() * _ip >>> 0,_ip])
}

if(arg == "-1"){
	console.log('--- 效率测试 IP查询(searchIP) ---')
	var tb,te,nn;
	
	tb = new Date();
	nn = v1(1000,qqwry1);
	te = new Date();
	console.log("单次查询("+(nn/10000)+"万次):"+ (te-tb) + "ms 平均:" + (te-tb)/nn);

	openspeed();

	tb = new Date();
	nn = v1(1000,qqwry1);
	te = new Date();
	console.log("单次查询("+(nn/10000)+"万次):"+ (te-tb) + "ms 平均:" + (te-tb)/nn);

}else if(arg == "-2"){
	console.log('--- 效率测试 IP段查询(searchIPScope) ---')
	var tb,te,n;

	tb = new Date();
	n = v2(null,qqwry1);
	te = new Date();
	console.log("IP段查询"+n[0]+"次(共获取"+(n[1]/10000)+"万条记录):"+ (te-tb) + "ms 平均:" + (te-tb)/n[1]);

	openspeed();

	tb = new Date();
	n = v2(null,qqwry1);
	te = new Date();
	console.log("IP段查询"+n[0]+"次(共获取"+(n[1]/10000)+"万条记录):"+ (te-tb) + "ms 平均:" + (te-tb)/n[1] );

}else if(arg == "-3"){
	console.log('--- 效率测试 IP段异步查询(searchIPScope) ---')
	var tb,te,n;

	tb = new Date();
	qqwry1.searchIPScope("0.0.0.0","255.255.255.255",function(err,iparr){
		te = new Date();
		n = iparr.length;
		console.log("IP段异步查询(共获取"+(n/10000)+"万条记录):"+ (te-tb) + "ms 平均:" + (te-tb)/n);
		
		openspeed();
		
		tb = new Date();
		qqwry1.searchIPScope("0.0.0.0","255.255.255.255",function(err,iparr){
			te = new Date();
			n = iparr.length;
			console.log("IP段异步查询(共获取"+(n/10000)+"万条记录):"+ (te-tb) + "ms 平均:" + (te-tb)/n);	
		});
	});

}else{//验证是否正常
	var loc = qqwry1.searchIP(arg || "255.255.255.255");
	console.log(loc);
	openspeed();
	var data = qqwry1.searchIPScope("0.0.0.0","255.255.255.255");
	console.log("共有数据: " + (data.length/10000) + "万条");
	return;
}

//单个IP查询
function v1(n,qqwry){
	var nb=0,ipsl=ips.length;
	for(var i = 0 ; i<n; i++){
		for(var ii=0,kk; ii<ipsl;kk = qqwry.searchIP(ips[ii++]));
		nb+=ipsl;
	}
	return nb;
}

//IP段查询
function v2(n,qqwry){
	var nb = 0,k = n || 1,ipdsl = ipds.length;
	for(var i = 0 ; i<k; i++){
		for(var ii = 0; ii < ipdsl; ii++){
			nb += qqwry.searchIPScope.apply(qqwry,ipds[ii]).length;
		}
		// nb += qqwry.searchIPScope("0.0.0.0","0.255.255.255").length;
		// nb += qqwry.searchIPScope("7.0.0.0","10.255.255.255").length;
		// nb += qqwry.searchIPScope("200.255.0.0","200.255.255.255").length;
		// nb += qqwry.searchIPScope("40.0.0.0","80.255.255.255").length;
		// nb += qqwry.searchIPScope("180.0.0.0","240.255.255.255").length;
		// nb += qqwry.searchIPScope("0.0.0.0","0.255.255.255").length;
		// nb += qqwry.searchIPScope("7.0.0.0","10.255.255.255").length;
		// nb += qqwry.searchIPScope("200.255.0.0","200.255.255.255").length;
		// nb += qqwry.searchIPScope("40.0.0.0","80.255.255.255").length;
		// nb += qqwry.searchIPScope("180.0.0.0","240.0.255.255").length;
	}
	return [k*ipdsl,nb];
}




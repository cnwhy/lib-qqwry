var libqqwry = require('../');
var qqwry1 = libqqwry();
// var qqwry2 = libqqwry.init();
var arg = process.argv[2];

function getQPS(n,s){
	return "QPS: " + (n/s).toFixed(1) + "k";
}

function openspeed(){
	qqwry1.speed();
	console.log('- 开启speed模式 -')
}

var ips = [],ipds=[];

//随机生成100个IP
for(var i = 0; i < 100; i++){
	ips.push(Math.random() * 0xFFFFFFFF >>> 0)
}

//随机生成10个IP
for(var i =0; i<5; i++){
	var _ip = ips[i]
	ipds.push([Math.random() * _ip >>> 0,_ip])
}

if(arg == "-1"){
	console.log('--- 效率测试 IP查询(searchIP) ---')
	var tb,te,nn;
	
	tb = new Date();
	nn = v1(100,qqwry1);
	te = new Date();
	console.log("单次查询("+(nn/10000)+"万次):"+ (te-tb) + "ms - " + getQPS(nn,te-tb));

	openspeed();

	tb = new Date();
	nn = v1(1000,qqwry1);
	te = new Date();
	console.log("单次查询("+(nn/10000)+"万次):"+ (te-tb) + "ms - " + getQPS(nn,te-tb));

}else if(arg == "-2"){
	console.log('--- 效率测试 IP段查询(searchIPScope) ---')
	var tb,te,n;

	tb = new Date();
	n = v2(null,qqwry1);
	te = new Date();
	console.log("IP段查询"+n[0]+"次(共获取"+(n[1]/10000)+"万条记录):"+ (te-tb) + "ms - " + getQPS(n[1],te-tb))

	openspeed();

	tb = new Date();
	n = v2(null,qqwry1);
	te = new Date();
	console.log("IP段查询"+n[0]+"次(共获取"+(n[1]/10000)+"万条记录):"+ (te-tb) + "ms - " + getQPS(n[1],te-tb))

}else if(arg == "-3"){
	console.log('--- 效率测试 IP段异步查询(searchIPScope) ---')
	var tb,te,n;

	tb = new Date();
	qqwry1.searchIPScope("0.0.0.0","255.255.255.255",function(err,iparr){
		te = new Date();
		n = iparr.length;
		console.log("IP段异步查询(共获取"+(n/10000)+"万条记录):"+ (te-tb) + "ms - " + getQPS(n,te-tb));
		openspeed();
		tb = new Date();
		qqwry1.searchIPScope("0.0.0.0","255.255.255.255",function(err,iparr){
			te = new Date();
			n = iparr.length;
			console.log("IP段异步查询(共获取"+(n/10000)+"万条记录):"+ (te-tb) + "ms - " + getQPS(n,te-tb));	
		});
	});

}else if(arg){//验证是否正常
	// qqwry1.speed();
	console.log(qqwry1.searchIP(arg));
}else{
	qqwry1.speed();
	var ips = ['0.0.0.0','255.255.255.255']
	var time1 = Date.now();
	var data = qqwry1.searchIPScope.apply(qqwry1,ips);
	var time2 = Date.now();
	var version = data[data.length-1]
	console.log(version.Country + version.Area);
	console.log(ips.join(' - ') + " | 共有数据:" + (data.length) + "条" , "查询耗时:" + (time2 - time1));
	console.log(getQPS(data.length,time2 - time1));
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




var fs = require('fs'),
	GBK = require("./GBK.js");
var dbug = false;
var IP_RECORD_LENGTH = 7,
	REDIRECT_MODE_1 = 0x01,
	REDIRECT_MODE_2 = 0x02,
	ipBegin,ipEnd,
	ipFileBuffer=null,ipFileBuffers=[],ipFmax=0,
	unArea ="未知地区",unCountry = "未知国家";

exports.DBUG = function(a){dbug=a;}

exports.info = function(callback){
	qqWryPath = __dirname + "/qqwry.dat";
	var rs = fs.createReadStream(qqWryPath);
	var data,n=0;
	rs.on("data", function (chunk){
		ipFileBuffers.push(chunk);
		ipFmax += chunk.length;
	});
	rs.on("end", function () {
		switch(ipFileBuffers.length) {//拼接Buffer
			case 0: 
				ipFileBuffer = new Buffer(0);
				break;
			case 1: 
				ipFileBuffer = ipFileBuffers[0];
				break;
			default:
				ipFileBuffer = new Buffer(ipFmax);
				for (var i = 0, pos = 0, l = ipFileBuffers.length; i < l; i++) {
					var chunk = ipFileBuffers[i];
					chunk.copy(ipFileBuffer, pos);
					pos += chunk.length;
				}
			break;
		}
		ipFileBuffers = null;
		ipBegin = setBuffer4();
		ipEnd = setBuffer4(4);
		ipCount = (ipEnd-ipBegin)/7+1;
		console.log("IP Server Start!(Begin:"+ipBegin+" End:"+ipEnd + " Count:" + ipCount + ")");
		if(typeof callback == "function"){callback();}
	});
}

exports.SearchIPLocation = function(ip,callback){
	var ipArray = ip.split("."),ip,b=ipBegin,e=ipEnd,g,loc={"ip":ip};
	if(!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)){ throw ("The IP address is not normal!"); };
	xH = "0x";
	for(var i=0;i<4;i++){
		ipArray[i] = ipArray[i]-0;
		if(ipArray[i]>255){throw ("The IP address is not normal!");}
		var h = ipArray[i].toString(16)
		xH += h.length == 1 ? "0" + h : h;
	}
	ip = xH - 0;
	var ipwz;
	g = LocateIP(ip);//查寻ip所在ip段;
	if(g == -1){//未找到此IP的地址记录
		return {"ip":ip,"Country":unArea,"Area":unCountry};
	}
	ipwz = setBuffer3(g+4); //2723489
	ipwz += 4;//跳过32位的IP地址;
	var lx = setIpFile(ipwz,1)[0];
	if(lx == REDIRECT_MODE_1){//Country，ipwz1 需要根据给定偏移处标识再判断
        ipwz = setBuffer3(ipwz+1); //读取国家偏移 (318461)
		lx = setIpFile(ipwz,1)[0]; //再次获取标识字节
		var Gjbut;
		if (lx == REDIRECT_MODE_2){ //再次检查标识字节
			Gjbut = setIpFileString(setBuffer3(ipwz+1));
			loc.Country = GBK.dc_GBK(Gjbut);
            ipwz = ipwz + 4;
		}else{
			Gjbut = setIpFileString(ipwz)
			loc.Country = GBK.dc_GBK(Gjbut);
            ipwz += Gjbut.length + 1;
		}
		loc.Area = ReadArea(ipwz);
	}else if(lx == REDIRECT_MODE_2){//Country直接读取偏移处字符串 Area根据标志再判断
		var Gjbut = setIpFileString(setBuffer3(ipwz+1));
		loc.Country = GBK.dc_GBK(Gjbut);
		loc.Area = ReadArea(ipwz + 4);
	}else{//Country直接读取 Area根据标志再判断
		var Gjbut = setIpFileString(ipwz);
		ipwz += Gjbut.length + 1;
		loc.Country = GBK.dc_GBK(Gjbut);
		loc.Area = ReadArea(ipwz);
	}
	dbug && console.log(loc);
	return loc;
}

//读取Area
function ReadArea(offset){
	var one = setIpFile(offset,1)[0];
	if (one == REDIRECT_MODE_1 || one == REDIRECT_MODE_2) {
		var areaOffset = setBuffer3(offset + 1);
		if (areaOffset == 0)
			return unArea;
		else {
			return GBK.dc_GBK(setIpFileString(areaOffset));
		}
	} else {
		return GBK.dc_GBK(setIpFileString(offset));
	}
}

function setBuffer4(n){
	var i = n || 0;
	return (new Buffer(setIpFile(i,4))).readUInt32LE(0);
}

function setBuffer3(n){
	var i = n || 0;
	var arr = setIpFile(i,3);
	arr[3] = 0;
	return (new Buffer(arr)).readUInt32LE(0);
}

//转化制定位数的LITTLE-ENDIAN为BIG-ENDIAN
function LITTLEtoBIG(data,begin,end){
	console.log(data);
	var int_=0.0 , i=begin || 0; max = end || (data.length-1);
	for(var n = 0;n<data.length;n++){
		int_ |= (data[i++] << (8*n));
		console.log(int_.toString(16));
		if(i>max){break;}
	}
	return int_;
}

//(从拼接的Buffer中)读取指定字节,返回数组
function setIpFile(Begin,Long){
	var B = Begin || 0,L = Long || 1,toarr = [];
	B = B < 0 ? 0: B;
	L = L <= 0 ? 1 : B+L>ipFileBuffer.length? ipFileBuffer.length-B:L;
	if(B<0 || B+L>ipFileBuffer.length) {return []};
	for(var i = B; i <= B+L ;i++){
		toarr.push(ipFileBuffer[i]);
	}
	return toarr;
}

//(拼接的Buffer中)读取字节,直到为0x00结束,返回数组
function setIpFileString(Begin){
	var B = Begin || 0,toarr = [], M = ipFileBuffer.length;
	B = B < 0 ? 0: B;
	for(var i = B ; i < M ;i++){
		if(ipFileBuffer[i] == 0){
			return toarr;
		}
		toarr.push(ipFileBuffer[i]);
	}
	return toarr;
}

// 取得begin和end中间的偏移(用于2分法查询);
function GetMiddleOffset(begin, end ,recordLength) {
	var records = (end - begin) / recordLength;
	records >>= 1;
	if (records == 0) records = 1;
	return begin + records * recordLength;
}

//2分法查找指定的IP偏移
function LocateIP(ip){
	var g,endip
	for (var b = ipBegin, e = ipEnd; b < e; ) {
		g = GetMiddleOffset(b,e,IP_RECORD_LENGTH);//获取中间位置
		var temp = setBuffer4(g);
		if(ip>temp){
			b = g;
		}else if(ip<temp){
			if(g == e){
				g -= IP_RECORD_LENGTH
				break;
			}
			e = g;
		}else{
			return g;
		}
	}
	var endip = setBuffer4(setBuffer3(g+4),4);	//再次验证查到的偏移处的结束IP段与ip比较；
	if(ip<=endip){
		return g;
	}else{
		return -1;
	}
}
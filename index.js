var GBK = null;
var IP_RECORD_LENGTH = 7,
	REDIRECT_MODE_1 = 0x01,
	REDIRECT_MODE_2 = 0x02,
	//IP_REGEXP = /^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/,
	IP_REGEXP1 = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
	
var dbug = false,ipDataPath,
	ipBegin,ipEnd,ipCount
	ipFileBuffer=null,ipFmax=0,
	unArea ="未知地区",unCountry = "未知国家";

exports.DBUG = function(a){dbug=a;}
exports.info = function(dataPath){
	var fs = require('fs'),
		Path = typeof(dataPath) == "string" ? dataPath : (__dirname + "/qqwry.dat");
	var callback = typeof arguments[arguments.length-1] == "function" ? arguments[arguments.length-1] : function(){};
	GBK = require("./gbk.js");
	ipFileBuffer = fs.readFileSync(Path);
	ipBegin = ipFileBuffer.readUInt32LE(0,true);
	ipEnd = ipFileBuffer.readUInt32LE(4,true);
	ipCount = (ipEnd-ipBegin)/7+1;
	console.log("==== IP Server Start! ==== [Begin:"+ipBegin+" End:"+ipEnd + " Count:" + ipCount + "]");
	callback();
	return this;
}

//查询IP的地址信息
exports.searchIP = function(IP){
	//IP = "255.255.255.255";
	var ip = this.ipToInt(IP),
		g = LocateIP(ip),
		loc={};
	if(g == -1){return {"ip":IP,"Country":unArea,"Area":unCountry};}
	var add = setIPLocation(g);
	loc.ip = this.intToIP(ip);
	loc.Country = add.Country;
	loc.Area = add.Area;
	dbug && console.log(loc);
	return loc;
}

//查询IP段的地址信息;scope
exports.searchIPScope = function(bginIP,endIP,callback){
	var _bIP = this.ipToInt(bginIP)
		,_endIP = this.ipToInt(endIP)
		,b_g = LocateIP(_bIP)
		,e_g = LocateIP(_endIP)
		,ips = [];
	for(var i = b_g; i<= e_g ; i+= IP_RECORD_LENGTH){
		var loc = {},add = setIPLocation(i);
		loc.begIP = this.intToIP(ipFileBuffer.readUInt32LE(i,true));
		loc.endIP = this.intToIP(ipFileBuffer.readUInt32LE(setBuffer3(i+4),true));
		loc.Country = add.Country;
		loc.Area = add.Area;
		ips.push(loc);
	}
	if(typeof callback === "function"){callback(ips);}
	return ips;
}

//ip地址转int
exports.ipToInt = function(IP){
	var result = IP_REGEXP1.exec(IP),ip;
	if(result){
		var ip_Arr = result.slice(1);
		ip =(parseInt(ip_Arr[0]) << 24 
			| parseInt(ip_Arr[1]) << 16
			| parseInt(ip_Arr[2]) << 8
			| parseInt(ip_Arr[3])) >>> 0;
	}else if(/^\d+$/.test(IP) && (ip=parseInt(IP))>=0 && ip <= 0xFFFFFFFF ){
		return ip;
	}else{
		throw ("The IP address is not normal!");
	}
	return ip;
}

//int转ip地址
exports.intToIP = function(INT){
	if(INT < 0 || INT > 0xFFFFFFFF){
		throw ("The number is not normal!");
	}
	return (INT>>>24) + "." + (INT>>>16 & 0xFF) + "." + (INT>>>8 & 0xFF) + "." + (INT>>>0 & 0xFF);
}

exports.infoAsync = function(){
	var o = this,args = arguments;
	setTimeout(function(){o.info.apply(o,args)});
	return this;
}

exports.searchIPScopeAsync = function(a,b,c){
	var o = this;
	setTimeout(function(){o.searchIPScope(a,b,c)});
	return this;
}

//查找地址信息
function setIPLocation(g){
	var ipwz = setBuffer3(g+4) + 4; //2723489
	var lx = ipFileBuffer.readUInt8(ipwz),
		loc={};
	if(lx == REDIRECT_MODE_1){//Country，ipwz1 需要根据给定偏移处标识再判断
        ipwz = setBuffer3(ipwz+1); //读取国家偏移
		lx = ipFileBuffer.readUInt8(ipwz); //再次获取标识字节
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
	return loc;
}

//读取Area
function ReadArea(offset){
	var one = ipFileBuffer.readUInt8(offset);
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

//获取3字节的索引地址;
function setBuffer3(n){
	return ipFileBuffer.readUInt32LE(n,true) & 0xFFFFFF;
}

//(拼接的Buffer中)读取字节,直到为0x00结束,返回数组
function setIpFileString(Begin){
	var B = Begin || 0,toarr = [], M = ipFileBuffer.length;
	B = B < 0 ? 0 : B;
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
	var records = ( (end - begin) / recordLength >> 1 ) * recordLength + begin; 
	//return records == begin ? records + recordLength : records;
	return records ^ begin ? records : records + recordLength;
}

//2分法查找指定的IP偏移
function LocateIP(ip){
	var g,endip,temp;
	for (var b=ipBegin,e=ipEnd;b<e;){
		g = GetMiddleOffset(b,e,IP_RECORD_LENGTH);//获取中间位置
		temp = ipFileBuffer.readUInt32LE(g,true);
		if(ip>temp){
			b = g;
		}else if(ip<temp){
			if(g == e){
				g -= IP_RECORD_LENGTH;
				break;
			}
			e = g;
		}else{
			break;
		}
	}
	if(dbug){
		endip = ipFileBuffer.readUInt32LE(setBuffer3(g+4),true); //再次验证查到的偏移处的结束IP段与ip比较；
		if(ip>endip){
			return -1;
		}
	}
	return g;
}
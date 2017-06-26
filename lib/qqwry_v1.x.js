"use strict";
var fs = require('fs')
var path = require('path');
var GBK = require("./gbk.js");

var IP_RECORD_LENGTH = 7,
	REDIRECT_MODE_1 = 1,
	REDIRECT_MODE_2 = 2,
	IP_REGEXP = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

var pathDefined = path.join(__dirname,"../data/qqwry.dat") //IP库默认路径
var dbug = false;

var Qqwry = function(speed,_path){
	var isspeed;
	if(typeof speed == "string"){
		this.dataPath = speed || pathDefined;
		isspeed = !!_path;
	}else{
		isspeed = !!speed;
		this.dataPath = _path || pathDefined;
	}
	var fd = this.fd = fs.openSync(this.dataPath,'r');
	var buf = new Buffer(8);
	fs.readSync(fd,buf,0,8)
	this.ipBegin = buf.readUInt32LE(0);
	this.ipEnd = buf.readUInt32LE(4);
	isspeed && this.speed();
}

//极速模式
Qqwry.prototype.speed = function(){
	if(this.ipFileBuffer) return this;
	var callback = typeof arguments[arguments.length-1] == "function" ? arguments[arguments.length-1] : null;
	this.ipFileBuffer = fs.readFileSync(this.dataPath); //缓存IP库文件;
	return this;
}

//关闭极速模式
Qqwry.prototype.unSpeed = function(){	
	this.ipFileBuffer = null;
}

Qqwry.prototype.searchIP = function(IP){
	var ip = ipToInt(IP),
		g = LocateIP.call(this,ip),
		loc={};
	if(g == -1){return {"ip":IP,"Country":unArea,"Area":unCountry};}
	var add = setIPLocation.call(this,g);
	loc.int = ip;
	loc.ip = intToIP(ip);
	loc.Country = add.Country;
	loc.Area = add.Area;
	dbug && log(loc);
	return loc;
}

Qqwry.prototype.searchIPScope = function(bginIP,endIP,callback){
	if(typeof callback === "function"){
		var o = this;
		process.nextTick(function(){
			try{
				callback(null,o.searchIPScope(bginIP,endIP));
			}catch(e){
				callback(e);
			}
		})
		return;
	}
	var _ip1,_ip2,b_g,e_g,ips=[];
	try{_ip1 = ipToInt(bginIP);}catch(e){throw ("The bginIP is not normal! >> " + bginIP);}
	try{_ip2 = ipToInt(endIP);}catch(e){throw ("The endIP is not normal! >> " + endIP);}
	b_g = LocateIP.call(this,_ip1);
	e_g = LocateIP.call(this,_ip2);
	for(var i = b_g; i<= e_g ; i+= IP_RECORD_LENGTH){
		var loc = {},add = setIPLocation.call(this,i);
		loc.begInt = readUIntLE.call(this,i,4);
		loc.endInt = readUIntLE.call(this,readUIntLE.call(this,i+4,3),4);
		loc.begIP = intToIP(loc.begInt);
		loc.endIP = intToIP(loc.endInt);
		loc.Country = add.Country;
		loc.Area = add.Area;
		ips.push(loc);
	}
	return ips;
}

//从指定位置(g),读取指定(w*8)位数int
function readUIntLE(g,w){
	g = g || 0;
	w = w < 1 ? 1 : w > 6 ? 6 : w;
	var buf;
	if(this.ipFileBuffer){
		return this.ipFileBuffer.readUIntLE(g,w)
	}else{
		buf = new Buffer(w);
		fs.readSync(this.fd,buf,0,w,g)
		return buf.readUIntLE(0,w)
	}
}

//读取字节,直到为0x00结束,返回数组
function setIpFileString(Begin){
	var B = Begin || 0,toarr = [], M;
	var isSuper = !!this.ipFileBuffer;
	M = isSuper ? this.ipFileBuffer.length : fs.fstatSync(this.fd).size;
	B = B < 0 ? 0 : B;
	for(var i = B ; i < M ;i++){
		var s;
		if(isSuper){
			s = this.ipFileBuffer[i];
		}else{
			var buf = new Buffer(1);
			fs.readSync(this.fd,buf,0,1,i)
			s = buf[0];
		}
		if(s == 0){
			return toarr;
		}
		toarr.push(s);
	}
	return toarr;
}

// 取得begin和end中间的偏移(用于2分法查询);
function GetMiddleOffset(begin, end ,recordLength) {
	var records = ( (end - begin) / recordLength >> 1 ) * recordLength + begin; 
	return records ^ begin ? records : records + recordLength;
}

//2分法查找指定的IP偏移
function LocateIP(ip){
	var g,temp;
	for (var b=this.ipBegin,e=this.ipEnd;b<e;){
		g = GetMiddleOffset(b,e,IP_RECORD_LENGTH);//获取中间位置
		temp = readUIntLE.call(this,g,4);
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
		var begip = readUIntLE.call(this,g,4);
			endip = readUIntLE.call(this,readUIntLE.call(this,g,3),4); //获取结束IP的值
		log(exports.intToIP(ip) + " >> " + ip);
		log(">> Indexes as \"" + g + "\" ( " + begip + " --> " + endip + " )");
		if(ip>endip){//与结束IP比较；正常情况不会出现这种情况,除非IP库漏掉了一些IP;
			return -1;
		}
	}
	return g;
}

function setIPLocation(g){
	var ipwz = readUIntLE.call(this,g+4,3) + 4;
	var lx = readUIntLE.call(this,ipwz,1),
		loc={};
	if(lx == REDIRECT_MODE_1){//Country根据标识再判断
        ipwz = readUIntLE.call(this,ipwz+1,3); //读取国家偏移
		lx = readUIntLE.call(this,ipwz,1); //再次获取标识字节
		var Gjbut;
		if (lx == REDIRECT_MODE_2){//再次检查标识字节
			Gjbut = setIpFileString.call(this,readUIntLE.call(this,ipwz+1,3));
			loc.Country = GBK.dc_GBK(Gjbut);
            ipwz = ipwz + 4;
		}else{
			Gjbut = setIpFileString.call(this,ipwz)
			loc.Country = GBK.dc_GBK(Gjbut);
            ipwz += Gjbut.length + 1;
		}
		loc.Area = ReadArea.call(this,ipwz);
	}else if(lx == REDIRECT_MODE_2){//Country直接读取偏移处字符串
		var Gjbut = setIpFileString.call(this,readUIntLE.call(this,ipwz+1,3));
		loc.Country = GBK.dc_GBK(Gjbut);
		loc.Area = ReadArea.call(this,ipwz + 4);
	}else{//Country直接读取 Area根据标志再判断
		var Gjbut = setIpFileString.call(this,ipwz);
		ipwz += Gjbut.length + 1;
		loc.Country = GBK.dc_GBK(Gjbut);
		loc.Area = ReadArea.call(this,ipwz);
	}
	return loc;
}

//读取Area
function ReadArea(offset){
	var one = readUIntLE.call(this,offset,1);
	if (one == REDIRECT_MODE_1 || one == REDIRECT_MODE_2) {
		var areaOffset = readUIntLE.call(this,offset + 1,3);
		if (areaOffset == 0)
			return unArea;
		else {
			return GBK.dc_GBK(setIpFileString.call(this,areaOffset));
		}
	} else {
		return GBK.dc_GBK(setIpFileString.call(this,offset));
	}
}

var ipToInt = newQqwry.ipToInt = function(IP){
	var result = IP_REGEXP.exec(IP),ip;
	if(result){
		var ip_Arr = result.slice(1);
		ip =(parseInt(ip_Arr[0]) << 24 
			| parseInt(ip_Arr[1]) << 16
			| parseInt(ip_Arr[2]) << 8
			| parseInt(ip_Arr[3])) >>> 0;
	}else if(/^\d+$/.test(IP) && (ip=parseInt(IP))>=0 && ip <= 0xFFFFFFFF ){
        ip = +IP
	}else{
		throw ("The IP address is not normal! >> " + IP);
	}
	return ip;
}

var intToIP = newQqwry.intToIP = function(INT){
	if(INT < 0 || INT > 0xFFFFFFFF){
		throw ("The number is not normal! >> " + INT);
	};
	return (INT>>>24) + "." + (INT>>>16 & 0xFF) + "." + (INT>>>8 & 0xFF) + "." + (INT>>>0 & 0xFF);
}

var ipEndianChange = newQqwry.ipEndianChange = function(INT){
	INT = INT & 0xFFFFFFFF;
	return (INT >>> 24 | (INT >> 8 & 0xFF00) | (INT << 8 & 0xFF0000) | (INT << 24)) >>> 0;
}

// Qqwry.init = function(path){
// 	return new Qqwry(path);
// }


function newQqwry(){
	var obj = {};
	obj.__proto__ = Qqwry.prototype;
	Qqwry.apply(obj,arguments);
	return obj;
}

newQqwry.init = function(){
	return newQqwry.apply(null,arguments);
}

module.exports = newQqwry;

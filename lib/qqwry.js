'use strict';
var fs = require('fs');
var path = require('path');
var GBK_decode = require('gbk.js').decode;

var IP_RECORD_LENGTH = 7,
	REDIRECT_MODE_1 = 1,
	REDIRECT_MODE_2 = 2,
	IP_REGEXP = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

var pathDefined = path.join(__dirname, '../data/qqwry.dat'); //IP库默认路径
var dbug = false;

var unArea = '',
	unCountry = '';

function Qqwry(speed, _path) {
	if (!(this instanceof Qqwry)) {
		return new Qqwry(speed, _path);
	}
	var isspeed;
	if (typeof speed == 'string') {
		this.dataPath = speed || pathDefined;
		isspeed = !!_path;
	} else {
		isspeed = !!speed;
		this.dataPath = _path || pathDefined;
	}
	if (isspeed) {
		this.speed();
	} else {
		this.cmd = fileCmd(this.dataPath);
	}
	this.cmd.open();
	this.ipBegin = this.cmd.readUIntLE(0, 4);
	this.ipEnd = this.cmd.readUIntLE(4, 4);
	this.dataSize = this.cmd.getDataSize();
	this.cmd.dispose();
}
//极速模式
Qqwry.prototype.speed = function() {
	if (this.ipFileBuffer) return this;
	this.ipFileBuffer = fs.readFileSync(this.dataPath); //缓存IP库文件;
	if (this.cmd) this.cmd.dispose();
	this.cmd = bufferCmd(this.ipFileBuffer);
	return this;
};

//关闭极速模式
Qqwry.prototype.unSpeed = function() {
	if (this.ipFileBuffer) {
		this.ipFileBuffer = null;
		if (this.cmd) this.cmd.dispose();
	}
	this.cmd = fileCmd(this.dataPath);
};

/**
 * 单IP查询
 * @param {int|string} IP IP地址
 */
Qqwry.prototype.searchIP = function(IP) {
	// if (!this.ipFileBuffer) openData.call(this);
	var cmd = this.cmd;
	cmd.open();
	var ip = ipToInt(IP),
		g = LocateIP.call(this, ip),
		loc = {};
	if (g == -1) {
		return { ip: IP, Country: unArea, Area: unCountry };
	}
	var add = setIPLocation.call(cmd, g);
	loc.int = ip;
	loc.ip = intToIP(ip);
	loc.Country = add.Country;
	loc.Area = add.Area;
	// closeData.call(this);
	cmd.dispose();
	dbug && log(loc);
	return loc;
};

/**
 * IP段查询
 * @param {int|string} bginIP 起始IP
 * @param {int|string} endIP 结束IP
 * @param {[function]} callback 
 */
Qqwry.prototype.searchIPScope = function(bginIP, endIP, callback) {
	var self = this;
	if (typeof callback === 'function') {
		return process.nextTick(function() {
			try {
				callback(null, self.searchIPScope(bginIP, endIP));
			} catch (e) {
				callback(e);
			}
		});
	}
	var cmd = self.cmd;
	cmd.open();
	var _ip1, _ip2, b_g, e_g;
	var ips = [];
	try {
		_ip1 = ipToInt(bginIP);
	} catch (e) {
		throw 'The bginIP is not normal! >> ' + bginIP;
	}
	try {
		_ip2 = ipToInt(endIP);
	} catch (e) {
		throw 'The endIP is not normal! >> ' + endIP;
	}
	b_g = LocateIP.call(this, _ip1);
	e_g = LocateIP.call(this, _ip2);
	for (var i = b_g; i <= e_g; i += IP_RECORD_LENGTH) {
		var loc = {},
			add = setIPLocation.call(cmd, i);
		loc.begInt = cmd.readUIntLE(i, 4);
		loc.endInt = cmd.readUIntLE(cmd.readUIntLE(i + 4, 3), 4);
		loc.begIP = intToIP(loc.begInt);
		loc.endIP = intToIP(loc.endInt);
		loc.Country = add.Country;
		loc.Area = add.Area;
		ips.push(loc);
	}
	// closeData.call(this);
	cmd.dispose();
	return ips;
};

function bufferCmd(buffer) {
	var max = buffer.length;
	return {
		name: 'bufferCmd',
		buffer: buffer,
		getDataSize: function() {
			return this.buffer.length;
		},
		readBuffer: function(g, w) {
			g = g || 0;
			w = w || 1;
			return this.buffer.slice(g, g + w);
		},
		readUIntLE: function(g, w) {
			g = g || 0;
			w = w < 1 ? 1 : w > 6 ? 6 : w;
			return this.buffer.readUIntLE(g, w);
		},
		getStringByteArray: function(g) {
			var B = g || 0;
			var toarr = [];
			for (var i = B; i < max; i++) {
				var s = this.buffer[i];
				if (s === 0) break;
				toarr.push(s);
			}
			// toarr.toString = function() {
			// 	return GBK_decode(this);
			// };
			return toarr;
		},
		readString_gbk: function(g) {
			return GBK_decode(this.getStringByteArray(g));
		},
		open: function() {},
		dispose: function() {}
	};
}

function fileCmd(path) {
	var fd = null;
	var max;
	return {
		name: 'fileCmd',
		getDataSize: function() {
			return fs.fstatSync(fd).size;
		},
		readBuffer: function(g, w) {
			g = g || 0;
			w = w || 1;
			var buf = new Buffer(w);
			fs.readSync(fd, buf, 0, w, g);
			return buf;
		},
		readUIntLE: function(g, w) {
			g = g || 0;
			w = w < 1 ? 1 : w > 6 ? 6 : w;
			return this.readBuffer(g, w).readUIntLE(0, w);
		},
		getStringByteArray: function(g) {
			var B = g || 0;
			var toarr = [];
			for (var i = B; i < max; i++) {
				var s = this.readBuffer(i, 1)[0];
				if (s === 0) break;
				toarr.push(s);
			}
			// toarr.toString = function() {
			// 	return GBK_decode(this);
			// };
			return toarr;
		},
		readString_gbk: function(g) {
			return GBK_decode(this.getStringByteArray(g));
		},
		open: function() {
			if (fd == null) {
				fd = fs.openSync(path, 'r');
			}
			if (!max) {
				max = this.getDataSize();
			}
		},
		dispose: function() {
			if (fd != null) {
				fs.closeSync(fd);
				fd = null;
			}
		}
	};
}

// 取得begin和end中间的偏移(用于2分法查询);
function GetMiddleOffset(begin, end, recordLength) {
	var records = (((end - begin) / recordLength) >> 1) * recordLength + begin;
	return records ^ begin ? records : records + recordLength;
}

//2分法查找指定的IP偏移
function LocateIP(ip) {
	var g, temp;
	for (var b = this.ipBegin, e = this.ipEnd; b < e; ) {
		g = GetMiddleOffset(b, e, IP_RECORD_LENGTH); //获取中间位置
		temp = this.cmd.readUIntLE(g, 4);
		if (ip > temp) {
			b = g;
		} else if (ip < temp) {
			if (g == e) {
				g -= IP_RECORD_LENGTH;
				break;
			}
			e = g;
		} else {
			break;
		}
	}
	if (dbug) {
		var begip = this.cmd.readUIntLE(g, 4);
		endip = this.cmd.readUIntLE(this.cmd.readUIntLE(g, 3), 4); //获取结束IP的值
		log(exports.intToIP(ip) + ' >> ' + ip);
		log('>> Indexes as "' + g + '" ( ' + begip + ' --> ' + endip + ' )');
		if (ip > endip) {
			//与结束IP比较；正常情况不会出现这种情况,除非IP库漏掉了一些IP;
			return -1;
		}
	}
	return g;
}

//获取IP地址对应区域
function setIPLocation(g) {
	var cmd = this;
	var ipwz = cmd.readUIntLE(g + 4, 3) + 4;
	var lx = cmd.readUIntLE(ipwz, 1),
		loc = {};
	if (lx == REDIRECT_MODE_1) {
		//Country根据标识再判断
		ipwz = cmd.readUIntLE(ipwz + 1, 3); //读取国家偏移`
		lx = cmd.readUIntLE(ipwz, 1); //再次获取标识字节
		var Gjbut;
		if (lx == REDIRECT_MODE_2) {
			//再次检查标识字节
			Gjbut = cmd.getStringByteArray(cmd.readUIntLE(ipwz + 1, 3));
			loc.Country = GBK_decode(Gjbut);
			// loc.Country = Gjbut.toString();
			ipwz = ipwz + 4;
		} else {
			Gjbut = cmd.getStringByteArray(ipwz);
			loc.Country = GBK_decode(Gjbut);
			// loc.Country = Gjbut.toString();
			ipwz += Gjbut.length + 1;
		}
		loc.Area = ReadArea.call(cmd, ipwz);
	} else if (lx == REDIRECT_MODE_2) {
		//Country直接读取偏移处字符串
		var Gjbut = cmd.getStringByteArray(cmd.readUIntLE(ipwz + 1, 3));
		loc.Country = GBK_decode(Gjbut);
		// loc.Country = Gjbut.toString();
		loc.Area = ReadArea.call(cmd, ipwz + 4);
	} else {
		//Country直接读取 Area根据标志再判断
		var Gjbut = cmd.getStringByteArray(ipwz);
		ipwz += Gjbut.length + 1;
		loc.Country = GBK_decode(Gjbut);
		// loc.Country = Gjbut.toString();
		loc.Area = ReadArea.call(cmd, ipwz);
	}
	return loc;
}

//读取Area
function ReadArea(offset) {
	var cmd = this;
	var one = cmd.readUIntLE(offset, 1);
	if (one == REDIRECT_MODE_1 || one == REDIRECT_MODE_2) {
		var areaOffset = cmd.readUIntLE(offset + 1, 3);
		if (areaOffset == 0) return unArea;
		else {
			return cmd.readString_gbk(areaOffset);
		}
	} else {
		return cmd.readString_gbk(offset);
	}
}

var ipToInt = (Qqwry.ipToInt = function(IP) {
	var result = IP_REGEXP.exec(IP),
		ip;
	if (result) {
		var ip_Arr = result.slice(1);
		ip =
			((parseInt(ip_Arr[0]) << 24) |
				(parseInt(ip_Arr[1]) << 16) |
				(parseInt(ip_Arr[2]) << 8) |
				parseInt(ip_Arr[3])) >>>
			0;
	} else if (/^\d+$/.test(IP) && (ip = parseInt(IP)) >= 0 && ip <= 0xffffffff) {
		ip = +IP;
	} else {
		throw 'The IP address is not normal! >> ' + IP;
	}
	return ip;
});

var intToIP = (Qqwry.intToIP = function(INT) {
	if (INT < 0 || INT > 0xffffffff) {
		throw 'The number is not normal! >> ' + INT;
	}
	return (
		(INT >>> 24) + '.' + ((INT >>> 16) & 0xff) + '.' + ((INT >>> 8) & 0xff) + '.' + ((INT >>> 0) & 0xff)
	);
});

var ipEndianChange = (Qqwry.ipEndianChange = function(INT) {
	INT = INT & 0xffffffff;
	return ((INT >>> 24) | ((INT >> 8) & 0xff00) | ((INT << 8) & 0xff0000) | (INT << 24)) >>> 0;
});

Qqwry.init = function() {
	return Qqwry.apply(null, arguments);
};

module.exports = Qqwry;

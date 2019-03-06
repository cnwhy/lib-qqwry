'use strict';
var fs = require('fs');
var path = require('path');
var stream = require('stream');
var GBK_decode = require('gbk.js').decode;

var IP_RECORD_LENGTH = 7,
	REDIRECT_MODE_1 = 1,
	REDIRECT_MODE_2 = 2,
	IP_REGEXP = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

var pathDefined = path.join(__dirname, '../data/qqwry.dat'); //IP库默认路径
var dbug = false;

var unArea = '',
	unCountry = '';

// console.log(Buffer.alloc);
if (!Buffer.alloc) {
	Buffer.alloc = function(a, b, c) {
		return new Buffer(a, b, c);
	};
}

//封装,方便使用
function pack() {
	var self = this;
	function IP(ip) {
		switch (arguments.length) {
			case 0:
				return self.searchIP('255.255.255.255');
			case 1:
				return self.searchIP(ip);
			case 2:
			default:
				return self.searchIPScope.apply(self, arguments);
		}
	}
	IP._lib = self;
	Object.keys(Qqwry.prototype).forEach(function(key) {
		if (typeof self[key] == 'function') {
			IP[key] = self[key].bind(self);
		}
	});
	return IP;
}

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
		this.unSpeed();
	}
	var cmd = this.cmd();
	this.ipBegin = cmd.readUIntLE(0, 4);
	this.ipEnd = cmd.readUIntLE(4, 4);
	cmd.close();
	return pack.call(this);
}
//极速模式
Qqwry.prototype.speed = function() {
	if (this.cmd && this.cmd.name == 'bufferCmd') return this;
	// if (this.cmd) this.cmd.close();
	this.cmd = bufferCmd(this.dataPath);
	return this;
};

//关闭极速模式
Qqwry.prototype.unSpeed = function() {
	if (this.cmd && this.cmd.name == 'fileCmd') return this;
	// if (this.cmd) this.cmd.close();
	this.cmd = fileCmd(this.dataPath);
	return this;
};

/**
 * 单IP查询
 * @param {int|string} IP IP地址
 */
Qqwry.prototype.searchIP = function(IP) {
	var cmd = this.cmd();
	var lib = getLib(this, cmd);
	var ip = ipToInt(IP),
		g = LocateIP.call(lib, ip),
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
	cmd.close();
	dbug && log(loc);
	return loc;
};

function getLib(consts, cmd) {
	return {
		ipBegin: consts.ipBegin,
		ipEnd: consts.ipEnd,
		cmd: cmd
	};
}
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
	var cmd = self.cmd();
	var lib = getLib(self, cmd);
	// cmd.open();
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
	b_g = LocateIP.call(lib, _ip1);
	e_g = LocateIP.call(lib, _ip2);
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
	cmd.close();
	return ips;
};

Qqwry.prototype.searchIPScopeStream = function(bginIP, endIP, options) {
	options = options || {};
	var format = options.format;
	var objectMode = format === 'object';
	var outHeader = options.outHeader == undefined ? false : !!options.outHeader;
	var cmd = this.cmd();
	var lib = getLib(this, cmd);
	// cmd.open();
	var _ip1, _ip2, b_g, e_g;
	var ips = [];
	_ip1 = ipToInt(bginIP);
	_ip2 = ipToInt(endIP);

	b_g = LocateIP.call(lib, _ip1);
	e_g = LocateIP.call(lib, _ip2);

	var i = b_g;
	var read = function(size) {
		var self = this;
		if (i > e_g) return cmd.close(), self.push(null);
		var add = setIPLocation.call(cmd, i),
			begInt = cmd.readUIntLE(i, 4),
			endInt = cmd.readUIntLE(cmd.readUIntLE(i + 4, 3), 4),
			begIP = intToIP(begInt),
			endIP = intToIP(endInt),
			Country = add.Country,
			Area = add.Area;
		var outstr = '';
		switch (format) {
			case 'csv':
				outstr +=
					i == b_g && outHeader
						? format_csv(['begInt', 'endInt', 'begIP', 'endIP', 'Country', 'Area'])
						: '';
				outstr += format_csv([begInt, endInt, begIP, endIP, Country, Area]);
				self.push(outstr);
				break;
			case 'json':
				// console.log('---------')
				outstr += i == b_g ? '[' : '';
				if (outHeader) {
					outstr += JSON.stringify({
						begInt: begInt,
						endInt: endInt,
						begIP: begIP,
						endIP: endIP,
						Country: Country,
						Area: Area
					});
				} else {
					outstr += JSON.stringify([begInt, endInt, begIP, endIP, Country, Area]);
				}
				outstr += i == e_g ? ']\n' : ',';
				self.push(outstr);
				break;
			case 'object':
				// console.log(self.readableFlowing);
				self.push([begInt, endInt, begIP, endIP, Country, Area]);
				break;
			case 'text':
			default:
				var _ipstr = begIP + ' - ' + endIP;
				_ipstr += _ipstr.length < 33 ? new Array(34 - _ipstr.length).join(' ') : '';
				self.push(_ipstr + ' ' + Country + ' ' + Area + '\n');
				// self.push(`${(begIP + ' - ' + endIP).padEnd(33)} ${Country} ${Area}\n`);
				break;
		}
		i += IP_RECORD_LENGTH;
	};
	var outss = new stream.Readable({
		objectMode: objectMode,
		// read: read,
		destroy: function(err, callback) {
			cmd.close();
			callback(err);
		}
	});
	outss._read = read;
	return outss;
};

/**
 * 对数据Buffer的操作类
 * @param {buffer} buffer 数据文件的buffer
 */
function bufferCmd(path) {
	var buffer = fs.readFileSync(path);
	var max = buffer.length;
	var api = {
		readBuffer: function(g, w) {
			g = g || 0;
			w = w || 1;
			return buffer.slice(g, g + w);
		},
		readUIntLE: function(g, w) {
			g = g || 0;
			w = w < 1 ? 1 : w > 6 ? 6 : w;
			return buffer.readUIntLE(g, w);
		},
		getStringByteArray: function(g) {
			var B = g || 0;
			var toarr = [];
			for (var i = B; i < max; i++) {
				var s = buffer[i];
				if (s === 0) break;
				toarr.push(s);
			}
			return toarr;
		},
		readString_gbk: function(g) {
			return GBK_decode(this.getStringByteArray(g));
		},
		close: function() {}
		// dispose: function() {
		// 	buffer = null;
		// }
	};
	return function bufferCmd() {
		return api;
	};
}

/**
 * 对数据文件的操作类
 * @param {string} path 文件地址
 */
function fileCmd(path) {
	return function fileCmd() {
		var fd, max;
		function open() {
			fd = fs.openSync(path, 'r');
			max || (max = fs.fstatSync(fd).size);
		}
		open();
		return {
			name: 'bufferCmd',
			readBuffer: function(g, w) {
				g = g || 0;
				w = w || 1;
				var buf = Buffer.alloc(w);
				// fd || open();
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
				return toarr;
			},
			readString_gbk: function(g) {
				return GBK_decode(this.getStringByteArray(g));
			},
			close: function() {
				if (fd != null) {
					fs.closeSync(fd);
					fd = null;
				}
			}
		};
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

function csv_decode(str) {
	return str.replace(/^(.*[,"\n].*)$/, function(k) {
		// console.log(arguments);
		return '"' + k.replace(/"/g, '""') + '"';
	});
}

function format_csv(val) {
	return (
		val
			.map(function(v) {
				return csv_decode(String(v));
			})
			.join(',') + '\n'
	);
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
		throw 'The IP number is not normal! >> ' + INT;
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

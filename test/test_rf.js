var fs = require('fs');
var path = require('path');
var fpath = '/Users/why/BaiduNetdisk_mac_2.2.2.dmg';
// var fpath = path.join(__dirname,"./demo.js");

function read3(path,cb){
	cb(null,fs.readFileSync(path));
}

function read1(path,cb){
	setTimeout(function(){
		cb(null,fs.readFileSync(path));
	},0)
}

function read2(path,cb){
	return fs.readFile(path,cb);
}

var max = 100;
// var readfn = read3;

var n1 = 0,n2 = 0, n3 = 0;
function work(name,fn,cb){
	setTimeout(function(){
		console.time(name);
		for(var i=0; i<=max; i++){
			// readfn(fpath,cb);
			fn(fpath,cb)
		}

	},1000)
}
function cb1(){
	if(++n1 == 100){
		console.timeEnd('read1')
		work('read2',read2,cb2)
	}
}

function cb2(){
	if(++n2 == 100){
		console.timeEnd('read2')
		work('read3',read3,cb3)
	}
}

function cb3(){
	if(++n3 == 100){
		console.timeEnd('read3')
	}
}
work('read1',read1,cb1)



var Qqwry = require('../');
var lib = Qqwry(true);

var ss = lib.searchIPScopeStream('220.255.255.255', '255.255.255.255', { type: 'csv', outHeader: true });

ss.pipe(process.stdout);

// while (true) {
// 	var obj = ss.read();
// 	if (obj) {
// 		console.log(obj.toString());
// 	} else {
// 		break;
// 	}
// }

// console.log(lib.searchIP('255.255.255.0'));
// console.log(ss.read());
// ss.on('error',console.error)
// ss.on('data',d=>console.log(d.toString()));
// setTimeout(function(){
// 	ss.destroy('end');
// },10)
// var kk = ss.read(5);
// console.log(ss.read().toString());
// console.log(lib.searchIP(-1>>>0));

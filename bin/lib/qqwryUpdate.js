require('stream.pipeline-shim/auto');
const zlib = require('zlib');
const util = require('util');
const fs = require('fs');
const stream = require('stream');
const axios = require('axios');
const GBK = require('gbk.js');
const pipeline = util.promisify(stream.pipeline);

const urls = {
	copywrite: 'http://update.cz88.net/ip/copywrite.rar',
	qqwry: 'http://update.cz88.net/ip/qqwry.rar'
};

class QqwryDecode extends stream.Transform {
	constructor(key, options) {
		super(options);
		this._key = key;
		this._writeN = 0x200;
	}
	_transform(chunk, encoding, callback) {
		if (this._writeN <= 0) return callback(null, chunk);
		let max = this._writeN > chunk.length ? chunk.length : this._writeN;
		let key = this._key;
		this._writeN -= max;
		for (let i = 0; i < max; i++) {
			key *= 0x805;
			key++;
			key &= 0xff;
			chunk[i] = chunk[i] ^ key;
		}
		this._key = key;
		return callback(null, chunk);
	}
	_flush(cb) {
		cb();
	}
}

async function getURLFile(url, resType = 'arraybuffer') {
	return axios.get(url, { responseType: resType }).then(res => res.data);
}

let get_copywrite = type => getURLFile(urls.copywrite, type);
let get_qqwry = type => getURLFile(urls.qqwry, type);

async function getLastInfo() {
	let copywrite = await get_copywrite('stream');
	copywrite.read(20);
	let key = copywrite.read(4).readUIntLE(0, 4);
	let version = GBK.decode(copywrite.read(128)).replace(/\0/g, '');
	return {
		version,
		key
	};
}

async function update(dataPath, key) {
	if (!key) {
		key = (await getLastInfo()).key;
	}
	return pipeline(
		await get_qqwry('stream'),
		new QqwryDecode(key),
		zlib.createInflate(),
		fs.createWriteStream(dataPath)
	);
}

exports.getLastInfo = getLastInfo;
exports.update = update;
exports.QqwryDecode = QqwryDecode;
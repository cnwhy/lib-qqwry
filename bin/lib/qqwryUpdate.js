require('stream.pipeline-shim/auto');
const zlib = require('zlib');
const util = require('util');
const fs = require('fs');
const stream = require('stream');
const axios = require('axios');
const GBK = require('gbk.js');
const pipeline = util.promisify(stream.pipeline);
const ProgressBar = require('progress');

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

// async function getURLFile(url, resType = 'arraybuffer') {
async function getURLFile(url, showProgressBar = false) {
	return axios
		.get(url, {
			responseType: 'stream',
			// 适应qqwry新规则
			headers: {
				'User-Agent': 'Mozilla/3.0 (compatible; Indy Library)'
			}
		})
		.then(res => {
			if (showProgressBar) {
				let bar = new ProgressBar(
					'downloading [:bar]:percent :rate/bps :etas',
					{
						complete: '=',
						incomplete: ' ',
						width: 20,
						total: +res.headers['content-length']
					}
				);
				res.data.on('data', function(buffer) {
					bar.tick(buffer.length);
				});
			}
			return res.data;
		});
}

let get_copywrite = showBar => getURLFile(urls.copywrite, showBar);
let get_qqwry = showBar => getURLFile(urls.qqwry, showBar);

async function getLastInfo() {
	let copywrite = await get_copywrite();
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
	let _temPath = dataPath + '.tmp';
	return pipeline(
		await get_qqwry(true),
		new QqwryDecode(key),
		zlib.createInflate(),
		fs.createWriteStream(_temPath)
	).then(() => {
		fs.renameSync(_temPath, dataPath);
	});
}

exports.getLastInfo = getLastInfo;
exports.update = update;
exports.QqwryDecode = QqwryDecode;

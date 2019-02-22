# lib-qqwry v2.x

- [x] 自动更新ip库数据
- [x] cli 工具使用
  - `$ qqwry search <ip> [ip...]` 查询IP , IP段
  - `$ qqwry remote` 获取最新IP库文件版本
  - `$ qqwry update` 更新IP库文件
- [ ] api Promise 风格转换
- [ ] 增加流形式API
  - IP段查询时,提升响应速度,降低内存使用
- [ ] 上传至 `npm` 前压缩 `qqwry.dat`, 安装后解压
- [ ] 安装时检查最新IP库版本
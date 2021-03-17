const path = require('path');
const process = require('process');

// 程序运行时的根目录，总是 real file system
process.env.APP_ROOT = process.cwd();

// 附加资源的根目录
// node 运行时：real file system
// pkg  运行时：snapshot file system
process.env.APP_RES_ROOT = __dirname;

// 依赖的程序包目录
// node 运行时：real file system
// pkg  运行时：snapshot file system
process.env.APP_NODE_MODULES = path.join(process.env.APP_RES_ROOT, 'node_modules');

const app = require(path.join(process.env.APP_ROOT, 'js/app.js'));

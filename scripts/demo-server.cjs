const express = require('../Back-end/node_modules/express');
const path = require('node:path');

require('./build-demo.cjs');
const server = express();
server.use('/demonstracao',express.static(path.resolve(__dirname,'../.deploy/demo')));
server.listen(Number(process.env.DEMO_PORT || 43766),'127.0.0.1',()=>console.log('Pronta em /demonstracao/'));

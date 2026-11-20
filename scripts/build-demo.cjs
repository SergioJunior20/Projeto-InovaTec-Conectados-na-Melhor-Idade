const fs = require('node:fs');
const path = require('node:path');

const source = path.resolve(__dirname,'../Front-end');
const output = path.resolve(__dirname,'../.deploy/demo');
const publicFiles = ['index.html','manifest.webmanifest','sw.js'];
const deployRoot = path.dirname(output);
if (fs.existsSync(deployRoot) && fs.lstatSync(deployRoot).isSymbolicLink()) {
  throw Error('A pasta .deploy não pode ser um link simbólico.');
}
for (const folder of ['CSS','JS','assets']) {
  for (const file of fs.readdirSync(path.join(source,folder),{withFileTypes:true})) {
    if (file.isFile() && /\.(?:css|js|png|jpe?g|webp|woff2|txt)$/i.test(file.name)) publicFiles.push(folder+'/'+file.name);
  }
}
const allowed = new Set([...publicFiles,'.nojekyll']);
function validateOutput(folder,prefix='') {
  if (!fs.existsSync(folder)) return;
  if (fs.lstatSync(folder).isSymbolicLink()) throw Error('A saída estática não pode ser um link simbólico.');
  for (const item of fs.readdirSync(folder,{withFileTypes:true})) {
    const relative = prefix+item.name;
    if (item.isDirectory() && ['CSS','JS','assets'].includes(relative)) validateOutput(path.join(folder,item.name),relative+'/');
    else if (!item.isFile() || !allowed.has(relative)) throw Error('Arquivo inesperado na publicação: '+relative);
  }
}
validateOutput(output);
for (const file of publicFiles) {
  const destination = path.join(output,file);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(path.join(source,file),destination);
}
fs.writeFileSync(path.join(output,'JS/ambiente.js'),'globalThis.ConectadosConfig = Object.freeze({demo:true});\n');
fs.writeFileSync(path.join(output,'.nojekyll'),'');
console.log('Demonstração estática gerada em .deploy/demo');

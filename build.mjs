import {build} from 'esbuild';import fs from 'node:fs';
fs.mkdirSync('dist',{recursive:true});
await build({entryPoints:['src/app.jsx'],bundle:true,minify:true,outfile:'dist/app.js',format:'esm',define:{'process.env.NODE_ENV':'"production"'}});
for(const f of ['index.html','style.css'])fs.copyFileSync('src/'+f,'dist/'+f);

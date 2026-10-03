import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {OBJECT_OUTPUT} from './day2-object-storyboard.js';
const files=['money-habits-script-v2.1-verified.md'];
for(const dir of ['output/day-1','output/day-2','output/day-3','output/benchmarks/day-1-v12-editorial-r2','output/benchmarks/day-2-v12','output/benchmarks/day-2-v12-workflow-rebuild']) {
  for(const entry of await readdir(dir,{withFileTypes:true}))if(entry.isFile())files.push(`${dir}/${entry.name}`);
}
const hashes=Object.fromEntries(await Promise.all(files.map(async f=>[f,createHash('sha256').update(await readFile(f)).digest('hex')])));
await mkdir(OBJECT_OUTPUT,{recursive:true});
const path=`${OBJECT_OUTPUT}/protected-before.json`;
try{await readFile(path);throw new Error('BASELINE_EXISTS: do not replace original evidence');}catch(e:any){if(e.code!=='ENOENT')throw e;}
await writeFile(path,JSON.stringify(hashes,null,2));
console.log('Protected snapshot',files.length);

import {access,copyFile,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {assertBenchmarkDestination} from '../src/contracts/benchmark-isolation.js';
import {DAY5_TRANSITIONS_OUT} from './day5-transitions.js';

const source='output/benchmarks/day-5-v12-differentactually';
const out=DAY5_TRANSITIONS_OUT;
assertBenchmarkDestination(out);
try{await access(out);throw new Error('DESTINATION_EXISTS: preserve all prior review artifacts');}catch(error:any){if(error.code!=='ENOENT')throw error;}
const hash=async(path:string)=>createHash('sha256').update(await readFile(path)).digest('hex');
const before:Record<string,string>=JSON.parse(await readFile(join(source,'protected-before.json'),'utf8'));
const addCurrent=(path:string)=>path.replaceAll('\\','/');

// Extend the verified Day 5 baseline with its complete current root artifacts
// and every benchmark MP4 present now, including later Day 4 review versions.
for(const entry of await readdir(source,{withFileTypes:true}))if(entry.isFile()){
 const path=addCurrent(join(source,entry.name));
 if(before[path]===undefined)before[path]=await hash(path);
}
for(const entry of await readdir('output/benchmarks',{withFileTypes:true}))if(entry.isDirectory()){
 const directory=join('output/benchmarks',entry.name);
 for(const file of await readdir(directory,{withFileTypes:true}))if(file.isFile()&&/\.mp4$/i.test(file.name)){
  const path=addCurrent(join(directory,file.name));
  if(before[path]===undefined)before[path]=await hash(path);
 }
}
for(const [path,expected] of Object.entries(before))if(await hash(path)!==expected)throw new Error('PROTECTED_CHANGED: '+path);

await mkdir(out);
await writeFile(join(out,'protected-before.json'),JSON.stringify(before,null,2));
const inputs=['script.json','script.txt','transcript.json','voice.mp3','number_highlights.json','audio-reuse.json','batch-comparison-history.json','full-script-analysis.json','visual-plan.json','data_visualizations.json','resolved-finance-plan.json','hero-captions.json','resolved-hero-captions.json','caption-coverage.json'];
const copied:Record<string,string>={};
for(const file of inputs){await copyFile(join(source,file),join(out,file));copied[file]=await hash(join(out,file));}
await writeFile(join(out,'preparation.json'),JSON.stringify({day:5,sourceDirectory:source,destination:out,ttsRegenerated:false,voiceAndWordBoundaryReused:true,protectedFiles:Object.keys(before).length,copiedInputs:copied},null,2));
console.log(`Prepared isolated Day 5 transitions; ${Object.keys(before).length} protected entries verified; narration/audio not regenerated.`);

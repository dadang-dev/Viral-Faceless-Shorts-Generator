import {readFile,writeFile,copyFile,mkdir,readdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ILLUSTRATED_OUT,illustratedPlan} from './day4-illustrated-plan.js';
import {TRANSITIONS_OUT} from './day4-transitions.js';
import {compileFinancePlan} from '../src/contracts/finance-motion.js';
import {extractApprovedVoiceOver,assertScriptIntegrity} from '../src/contracts/content-contract.js';
import {resolveHeroCaptions,editorialCaptionWords} from '../src/contracts/hero-captions.js';
const transitions=process.argv.includes('--transitions');
const out=transitions?TRANSITIONS_OUT:ILLUSTRATED_OUT;
const old=transitions?ILLUSTRATED_OUT:'output/benchmarks/day-4-v12-six-scene';
const json=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const hash=async(p:string)=>createHash('sha256').update(await readFile(p)).digest('hex');
try{await mkdir(out);}catch(e:any){
 if(e.code!=='EEXIST'||!process.argv.includes('--resume-preparation'))throw e;
 for(const f of ['index.html','video.mp4']){try{await access(`${out}/${f}`);throw new Error('REVIEW_DESTINATION_EXISTS');}catch(error:any){if(error.code!=='ENOENT')throw error;}}
}
const before=await json(`${old}/protected-before.json`);
for(const e of await readdir(old,{withFileTypes:true}))if(e.isFile())before[`${old}/${e.name}`]=await hash(`${old}/${e.name}`);
for(const p of Object.keys(before))if(await hash(p)!==before[p])throw new Error('PROTECTED_CHANGED: '+p);
await writeFile(`${out}/protected-before.json`,JSON.stringify(before,null,2));
for(const f of ['script.json','script.txt','transcript.json','voice.mp3','number_highlights.json','audio-reuse.json','batch-comparison-history.json','sensory.css','design-tokens.json'])await copyFile(`${old}/${f}`,`${out}/${f}`);
const script=await json(`${out}/script.json`),transcript=await json(`${out}/transcript.json`);
const approved=extractApprovedVoiceOver(await readFile('money-habits-script-v2.1-verified.md','utf8'),4);assertScriptIntegrity(script,approved);
const input=illustratedPlan(),resolved=compileFinancePlan(input,script,transcript,approved);
// Preserve every spoken word as captions; sparse structural headings don't replace narration.
const captions=resolveHeroCaptions([],resolved,transcript);
for(const [f,value] of Object.entries({'data_visualizations.json':input,'resolved-finance-plan.json':resolved,'hero-captions.json':[],'resolved-hero-captions.json':captions,'caption-coverage.json':editorialCaptionWords(transcript,captions),'visual-plan.json':{version:'1.1',day:4,primaryArchetype:'concept-story',secondaryArchetype:'comparison',layoutDirection:'mixed',repeatedIconComposition:'large-illustrated-situations;adult-phone;night-order-coffee;relief-receipt;finger-checkout-pause',rationale:'User-authorized image-led remake: source-linked person/object actions carry meaning; no giant sentence-card sequence.'},'full-script-analysis.json':{approvedVoiceText:approved,plan:await readFile('docs/day-4-illustrated-revision.md','utf8')}}))await writeFile(`${out}/${f}`,JSON.stringify(value,null,2));
console.log('Prepared illustrated Day 4; protected files',Object.keys(before).length);

import {access,copyFile,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {assertBenchmarkDestination} from '../src/contracts/benchmark-isolation.js';
import {APPROVED_SCRIPT_FILE,NumberHighlightFileSchema,assertScriptIntegrity,extractApprovedVoiceOver,resolveNumberHighlights} from '../src/contracts/content-contract.js';
import {compileFinancePlan,assessFinanceDataViz,assertFinanceHighlights} from '../src/contracts/finance-motion.js';
import {planOutroDwell} from '../src/contracts/production-duration.js';
import {resolveHeroCaptions,editorialCaptionWords} from '../src/contracts/hero-captions.js';
import {validateNumericRelationships} from '../src/contracts/numeric-relationships.js';
import {DAY5_RICH_STORY_CSS} from './day5-rich-story-art.js';
import {DAY5_RICH_LAYOUT,DAY5_RICH_STORY_OUT,day5RichStoryPlan,extendDay5RichVisualThroughOutro} from './day5-rich-story-plan.js';

const parent='output/benchmarks/day-5-v12-transitions',out=DAY5_RICH_STORY_OUT;
assertBenchmarkDestination(out);
const resume=process.argv.includes('--resume-preparation');
let destinationExists=true;
try{await access(out);}catch(error:any){if(error.code==='ENOENT')destinationExists=false;else throw error;}
if(destinationExists&&!resume)throw new Error('DESTINATION_EXISTS: preserve existing review artifacts; use --resume-preparation only for an incomplete preparation');
if(destinationExists){
 // A preflight HTML may be regenerated. Any encoded/mixed media freezes preparation.
 for(const file of ['video.mp4','video-raw.mp4','video-without-sfx.mp4','video-sfx-staging.mp4'])try{await access(join(out,file));throw new Error(`REVIEW_ARTIFACT_EXISTS: ${file}`);}catch(error:any){if(error.code!=='ENOENT')throw error;}
 const previous=JSON.parse(await readFile(join(out,'protected-before.json'),'utf8'));
 for(const [path,expected] of Object.entries(previous))if(await createHash('sha256').update(await readFile(path)).digest('hex')!==expected)throw new Error(`PROTECTED_CHANGED_BEFORE_RESUME: ${path}`);
}
const hash=async(path:string)=>createHash('sha256').update(await readFile(path)).digest('hex');
const normalized=(path:string)=>path.replaceAll('\\','/');
const protectedFiles:Record<string,string>=JSON.parse(await readFile(join(parent,'protected-before.json'),'utf8'));
for(const entry of await readdir(parent,{withFileTypes:true}))if(entry.isFile()){
 const path=normalized(join(parent,entry.name));if(protectedFiles[path]===undefined)protectedFiles[path]=await hash(path);
}
for(const entry of await readdir('output/benchmarks',{withFileTypes:true}))if(entry.isDirectory()){
 const dir=join('output/benchmarks',entry.name);
 for(const file of await readdir(dir,{withFileTypes:true}))if(file.isFile()&&/\.mp4$/i.test(file.name)){
  const path=normalized(join(dir,file.name));if(protectedFiles[path]===undefined)protectedFiles[path]=await hash(path);
 }
}
for(const [path,expected] of Object.entries(protectedFiles))if(await hash(path)!==expected)throw new Error(`PROTECTED_CHANGED: ${path}`);

await mkdir(out,{recursive:true});
await writeFile(join(out,'protected-before.json'),JSON.stringify(protectedFiles,null,2));
const files=['script.json','script.txt','transcript.json','voice.mp3','number_highlights.json','audio-reuse.json','batch-comparison-history.json','full-script-analysis.json','visual-plan.json','data_visualizations.json','hero-captions.json','resolved-hero-captions.json','caption-coverage.json'];
const copied:Record<string,string>={};
for(const file of files){await copyFile(join(parent,file),join(out,file));copied[file]=await hash(join(out,file));}

const json=async(path:string)=>JSON.parse(await readFile(join(out,path),'utf8'));
const sourceText=await readFile(APPROVED_SCRIPT_FILE,'utf8');
const approved=extractApprovedVoiceOver(sourceText,5),script=await json('script.json'),transcript=await json('transcript.json');
assertScriptIntegrity(script,approved);
if(!await readFile(join(out,'voice.mp3')).then(async current=>current.equals(await readFile(join(parent,'voice.mp3')))))throw new Error('VOICE_BYTES_CHANGED');
if(!await readFile(join(out,'transcript.json')).then(async current=>current.equals(await readFile(join(parent,'transcript.json')))))throw new Error('WORDBOUNDARY_BYTES_CHANGED');

const plan=day5RichStoryPlan(await json('data_visualizations.json'));
const finance=extendDay5RichVisualThroughOutro(compileFinancePlan(plan,script,transcript,approved),planOutroDwell(transcript,.2,3).finalTargetSec);
const numberSource=NumberHighlightFileSchema.parse(await json('number_highlights.json'));
const highlights=resolveNumberHighlights(numberSource,transcript);assertFinanceHighlights(finance,highlights);
const numeric=validateNumericRelationships(plan.data,plan.relationships??[]);
const visualPlan={version:'1.1',day:5,primaryArchetype:'concept-story',secondaryArchetype:'comparison',layoutDirection:'mixed',repeatedIconComposition:'one-retained-statement;unfurling-ledger;source-linked-category-vignettes;repeating-charge-to-recipient;row-by-row-review',rationale:'Day 5 story-led remake. A single statement and recurring-charge line evolve with the narration; comparison ranges remain exact; subscription examples appear as contextual illustrations, not standalone icon cards.'};
const captions=resolveHeroCaptions(await json('hero-captions.json'),finance,transcript);
const coverage=editorialCaptionWords(transcript,captions);
for(const [name,value] of Object.entries({
 'data_visualizations.json':plan,
 'resolved-finance-plan.json':finance,
 'visual-plan.json':visualPlan,
 'resolved-hero-captions.json':captions,
 'caption-coverage.json':coverage,
 'numeric-integrity.json':{status:'PASS',relationships:numeric,approvedFacts:plan.data.map(d=>({display:d.display,sourcePhrase:d.sourceSpan})),charts:'N/A',derivedValues:[]},
 'sensory.css':DAY5_RICH_STORY_CSS,
 'design-tokens.json':{version:'1.0',day:5,scope:'isolated benchmark',tokens:{background:'#0B1526',grid:'#152238',text:'#FFFFFF',muted:'#A0AEC0',amber:'#F5A623',gold:'#D4AF37'},texture:{kind:'static grain and fine grid',backgroundOnly:true},captions:{primary:'#FFFFFF',active:'#F5A623'}},
 'full-script-analysis.json':{approvedVoiceText:approved,voiceSha256:await hash(join(out,'voice.mp3')),transcriptSha256:await hash(join(out,'transcript.json')),sourceFile:APPROVED_SCRIPT_FILE,visualPlan,layout:DAY5_RICH_LAYOUT,changes:'Visual-only derivative of the Day 5 transition benchmark; canonical narration and word boundaries are immutable.'},
}))await writeFile(join(out,name),JSON.stringify(value,null,2));

for(const [path,expected] of Object.entries(protectedFiles))if(await hash(path)!==expected)throw new Error(`PROTECTED_CHANGED_DURING_PREPARATION: ${path}`);
await writeFile(join(out,'preparation.json'),JSON.stringify({status:'PASS',day:5,parent,destination:out,voiceAndWordBoundaryReused:true,ttsRegenerated:false,protectedFiles:Object.keys(protectedFiles).length,copiedInputs:copied,financeSequences:finance.sequences.map(s=>({id:s.id,startSec:s.startSec,endSec:s.endSec})),numericHighlights:highlights.map(h=>({id:h.id,atSec:h.globalStartSec})),numericIntegrity:'PASS',storyScenes:Object.keys(DAY5_RICH_LAYOUT)},null,2));
console.log(`Prepared isolated Day 5 rich-story benchmark; ${Object.keys(protectedFiles).length} protected entries verified; voice and WordBoundary bytes reused.`);

import {access,copyFile,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {assertBenchmarkDestination} from '../src/contracts/benchmark-isolation.js';
import {APPROVED_SCRIPT_FILE,NumberHighlightFileSchema,assertScriptIntegrity,extractApprovedVoiceOver,resolveNumberHighlights} from '../src/contracts/content-contract.js';
import {assertFinanceHighlights,compileFinancePlan} from '../src/contracts/finance-motion.js';
import {resolveHeroCaptions,editorialCaptionWords} from '../src/contracts/hero-captions.js';
import {validateNumericRelationships} from '../src/contracts/numeric-relationships.js';
import {DAY7_RICH_LAYOUT,DAY7_RICH_STORY_OUT,DAY7_RICH_VISUAL_PLAN,day7RichStoryPlan} from './day7-rich-story-plan.js';

const parent='output/benchmarks/day-7-v12-differentactually',out=DAY7_RICH_STORY_OUT;
assertBenchmarkDestination(out);
try{await access(out);throw new Error('DESTINATION_EXISTS: Day 7 rich-story candidate is immutable once prepared');}catch(error:any){if(error.code!=='ENOENT')throw error;}
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
for(const [path,expected] of Object.entries(protectedFiles))if(await hash(path)!==expected)throw new Error('PROTECTED_CHANGED_BEFORE_PREPARATION: '+path);
await mkdir(out,{recursive:true});
await writeFile(join(out,'protected-before.json'),JSON.stringify(protectedFiles,null,2));
const files=['script.json','script.txt','transcript.json','voice.mp3','number_highlights.json','audio-reuse.json','batch-comparison-history.json','full-script-analysis.json','visual-plan.json','data_visualizations.json','hero-captions.json','resolved-hero-captions.json','caption-coverage.json'];
const copied:Record<string,string>={};
for(const file of files){await copyFile(join(parent,file),join(out,file));copied[file]=await hash(join(out,file));}
const json=async(path:string)=>JSON.parse(await readFile(join(out,path),'utf8'));
const approved=extractApprovedVoiceOver(await readFile(APPROVED_SCRIPT_FILE,'utf8'),7),script=await json('script.json'),transcript=await json('transcript.json');
assertScriptIntegrity(script,approved);
if(await hash(join(out,'voice.mp3'))!==await hash(join(parent,'voice.mp3'))||await hash(join(out,'transcript.json'))!==await hash(join(parent,'transcript.json')))throw new Error('DAY7_AUDIO_OR_WORDBOUNDARY_CHANGED');
const plan=day7RichStoryPlan(await json('data_visualizations.json'));
const finance=compileFinancePlan(plan,script,transcript,approved);
const numbers=NumberHighlightFileSchema.parse(await json('number_highlights.json'));
const highlights=resolveNumberHighlights(numbers,transcript);assertFinanceHighlights(finance,highlights);
const numeric=validateNumericRelationships(plan.data,plan.relationships??[]);
const captions=resolveHeroCaptions(await json('hero-captions.json'),finance,transcript);
const coverage=editorialCaptionWords(transcript,captions);
const storyboard={day:7,source:APPROVED_SCRIPT_FILE,sequences:[
 {id:'five-category-recap',states:['Five distinct source-named objects reveal at their individual spoken labels','five-way bracket and common focus become visible','not-noticing scan makes every existing object easier to see'],sourceSpans:['subscription creep','lifestyle creep','girl math','emotional spending','saving feels impossible','Five different habits','One thing in common','not noticing']},
 {id:'honest-question-recap',states:['spreadsheet grid is visible','grid recedes at to fix','unfilled question tile comes forward at one honest question'],sourceSpans:['a spreadsheet','to fix','one honest question']},
 {id:'single-choice',states:['all five known icons return; none preselected','one empty choice slot opens at pick just ONE','grid briefly appears for full budget overhaul and retreats','clarity lens focuses the unfilled slot','five options and comment icon remain beneath the profile CTA'],sourceSpans:['recap challenge','pick just ONE','one honest question','Not all five','Just one','full budget overhaul','see clearly','Which one','Tell me below']},
 ],constraints:['No added narration, monetary numbers, SFX or episode-specific transition effect.','No habit is selected on behalf of the viewer.','All illustration reveals use exact WordBoundary-linked source phrases.']};
for(const [name,value] of Object.entries({
 'data_visualizations.json':plan,
 'resolved-finance-plan.json':finance,
 'visual-plan.json':DAY7_RICH_VISUAL_PLAN,
 'resolved-hero-captions.json':captions,
 'caption-coverage.json':coverage,
 'numeric-integrity.json':{status:'PASS',relationships:numeric,approvedFacts:plan.data.map(item=>({display:item.display,sourcePhrase:item.sourceSpan,unitSource:item.unitSource?.sourceSpan})),charts:'N/A',derivedValues:[]},
 'design-tokens.json':{version:'1.0',day:7,scope:'isolated benchmark',tokens:{background:'#071426',surface:'#0D2038',raised:'#132B47',text:'#F5F1E8',muted:'#A0AEC0',gold:'#D7A928',amber:'#F2C14E'},texture:'none',sfx:'none',sceneTransition:'shared 180ms crossfade'},
 'full-script-analysis.json':{approvedVoiceText:approved,voiceSha256:await hash(join(out,'voice.mp3')),transcriptSha256:await hash(join(out,'transcript.json')),sourceFile:APPROVED_SCRIPT_FILE,visualPlan:DAY7_RICH_VISUAL_PLAN,layout:DAY7_RICH_LAYOUT,changes:'Day 7 episode-local source-linked illustrated recap and neutral choice board; canonical narration, voice and WordBoundary bytes unchanged.'},
 'storyboard.json':storyboard,
 }))await writeFile(join(out,name),JSON.stringify(value,null,2));
for(const [path,expected] of Object.entries(protectedFiles))if(await hash(path)!==expected)throw new Error('PROTECTED_CHANGED_DURING_PREPARATION: '+path);
await writeFile(join(out,'preparation.json'),JSON.stringify({status:'PASS',day:7,parent,destination:out,voiceAndWordBoundaryReused:true,ttsRegenerated:false,protectedFiles:Object.keys(protectedFiles).length,copiedInputs:copied,financeSequences:finance.sequences.map(sequence=>({id:sequence.id,startSec:sequence.startSec,endSec:sequence.endSec})),numericIntegrity:'PASS',storyEvents:finance.sequences.reduce((count,sequence)=>count+sequence.motionEvents.length,0),addedAudio:false},null,2));
console.log('Prepared isolated Day 7 rich-story candidate; '+Object.keys(protectedFiles).length+' protected entries verified; voice and WordBoundary bytes reused.');

import {access,copyFile,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {assertBenchmarkDestination} from '../src/contracts/benchmark-isolation.js';
import {APPROVED_SCRIPT_FILE,NumberHighlightFileSchema,assertScriptIntegrity,extractApprovedVoiceOver,resolveNumberHighlights} from '../src/contracts/content-contract.js';
import {assertFinanceHighlights,compileFinancePlan} from '../src/contracts/finance-motion.js';
import {resolveHeroCaptions,editorialCaptionWords} from '../src/contracts/hero-captions.js';
import {validateNumericRelationships} from '../src/contracts/numeric-relationships.js';
import {DAY6_RICH_CHARACTER_OUT,DAY6_RICH_LAYOUT,DAY6_RICH_STORY_OUT,DAY6_RICH_VISUAL_PLAN,day6RichStoryPlan} from './day6-rich-story-plan.js';

const parent='output/benchmarks/day-6-v12-differentactually';
const characterRevision=process.argv.includes('--character-revision');
const out=characterRevision?DAY6_RICH_CHARACTER_OUT:DAY6_RICH_STORY_OUT;
assertBenchmarkDestination(out);
const resume=process.argv.includes('--resume-preparation');
let destinationExists=true;
try{await access(out);}catch(error:any){if(error.code==='ENOENT')destinationExists=false;else throw error;}
if(destinationExists&&!resume)throw new Error('DESTINATION_EXISTS: preserve existing Day6 review artifacts; explicit resume required');
if(destinationExists){
 for(const file of ['video.mp4','video-raw.mp4','video-with-sfx.mp4'])try{await access(join(out,file));throw new Error('REVIEW_ARTIFACT_EXISTS: '+file);}catch(error:any){if(error.code!=='ENOENT')throw error;}
}
const hash=async(path:string)=>createHash('sha256').update(await readFile(path)).digest('hex');
const normalized=(path:string)=>path.replaceAll('\\','/');
const protectedFiles:Record<string,string>=JSON.parse(await readFile(join(parent,'protected-before.json'),'utf8'));
for(const entry of await readdir(parent,{withFileTypes:true}))if(entry.isFile()){
 const path=normalized(join(parent,entry.name));if(protectedFiles[path]===undefined)protectedFiles[path]=await hash(path);
}
for(const entry of await readdir('output/benchmarks',{withFileTypes:true}))if(entry.isDirectory()){
 const dir=join('output/benchmarks',entry.name);
 for(const file of await readdir(dir,{withFileTypes:true}))if(file.isFile()&&/\\.mp4$/i.test(file.name)){
  const path=normalized(join(dir,file.name));if(protectedFiles[path]===undefined)protectedFiles[path]=await hash(path);
 }
}
for(const [path,expected] of Object.entries(protectedFiles))if(await hash(path)!==expected)throw new Error('PROTECTED_CHANGED_BEFORE_PREPARATION: '+path);

await mkdir(out,{recursive:true});
if(destinationExists){
 const previous=JSON.parse(await readFile(join(out,'protected-before.json'),'utf8'));
 for(const [path,expected] of Object.entries(previous))if(await hash(path)!==expected)throw new Error('PROTECTED_CHANGED_DURING_RESUME: '+path);
}
await writeFile(join(out,'protected-before.json'),JSON.stringify(protectedFiles,null,2));
const files=['script.json','script.txt','transcript.json','voice.mp3','number_highlights.json','audio-reuse.json','batch-comparison-history.json','full-script-analysis.json','visual-plan.json','data_visualizations.json','hero-captions.json','resolved-hero-captions.json','caption-coverage.json'];
const copied:Record<string,string>={};
for(const file of files){await copyFile(join(parent,file),join(out,file));copied[file]=await hash(join(out,file));}

const json=async(path:string)=>JSON.parse(await readFile(join(out,path),'utf8'));
const sourceText=await readFile(APPROVED_SCRIPT_FILE,'utf8');
const approved=extractApprovedVoiceOver(sourceText,6),script=await json('script.json'),transcript=await json('transcript.json');
assertScriptIntegrity(script,approved);
if(!await readFile(join(out,'voice.mp3')).then(async current=>current.equals(await readFile(join(parent,'voice.mp3')))))throw new Error('VOICE_BYTES_CHANGED');
if(!await readFile(join(out,'transcript.json')).then(async current=>current.equals(await readFile(join(parent,'transcript.json')))))throw new Error('WORDBOUNDARY_BYTES_CHANGED');

const plan=day6RichStoryPlan(await json('data_visualizations.json'));
const finance=compileFinancePlan(plan,script,transcript,approved);
const numberSource=NumberHighlightFileSchema.parse(await json('number_highlights.json'));
const highlights=resolveNumberHighlights(numberSource,transcript);assertFinanceHighlights(finance,highlights);
const numeric=validateNumericRelationships(plan.data,plan.relationships??[]);
const visualPlan=DAY6_RICH_VISUAL_PLAN;
const captions=resolveHeroCaptions(await json('hero-captions.json'),finance,transcript);
const coverage=editorialCaptionWords(transcript,captions);
for(const [name,value] of Object.entries({
 'data_visualizations.json':plan,
 'resolved-finance-plan.json':finance,
 'visual-plan.json':visualPlan,
 'resolved-hero-captions.json':captions,
 'caption-coverage.json':coverage,
 'numeric-integrity.json':{status:'PASS',relationships:numeric,approvedFacts:plan.data.map(item=>({display:item.display,sourcePhrase:item.sourceSpan,unitSource:item.unitSource?.sourceSpan})),charts:'N/A',derivedValues:[]},
 'design-tokens.json':{version:'1.0',day:6,scope:'isolated benchmark',tokens:{background:'#071426',surface:'#0D2038',raised:'#132B47',text:'#F5F1E8',muted:'#C9C2B5',gold:'#D7A928',amber:'#F2C14E'},texture:'none',sfx:'none in visual render; original three SFX retained in the separately mixed review candidate',sceneTransition:'shared 180ms crossfade'},
 'full-script-analysis.json':{approvedVoiceText:approved,voiceSha256:await hash(join(out,'voice.mp3')),transcriptSha256:await hash(join(out,'transcript.json')),sourceFile:APPROVED_SCRIPT_FILE,visualPlan,layout:DAY6_RICH_LAYOUT,changes:characterRevision?'Day-specific visual-only character correction. Connected head, neck, torso, arms and phrase-linked hands; scene-specific facial expressions. Canonical narration, voice, WordBoundary, sequence plan and SFX remain unchanged.':'Day-specific visual-only derivative. Four semantic sequences, canonical narration, voice and WordBoundary bytes remain unchanged.'},
 'storyboard.json':{day:6,source:APPROVED_SCRIPT_FILE,sequences:[
  {id:'scarcity-question',states:['person at desk','math sheet appears at its spoken phrase','same wallet tightens on scarcity phrase'],sourceSpans:['math problem','scarcity mindset']},
  {id:'tight-wallet',states:['past calendar appears','college notes appear','one unmarked coin is guarded','clear savings jar appears'],sourceSpans:['years ago','a stressful semester in college','every dollar','the last one','saving feel unsafe']},
  {id:'knowing-feeling',states:['advice slip recedes','fear is revealed','knowledge page/check appears','jar is shielded at feeling-safe phrase'],sourceSpans:['doesn\'t work','the actual fear','saving is good','saving doesn\'t FEEL safe']},
  {id:'weekly-safekeeping',states:['small action begins','existing $5 metric and A WEEK label reveal','one coin moves from wallet to clear jar and remains visible','safety then capacity are emphasized','story clears at the final spoken word'],sourceSpans:['start with an amount','five dollars','a week','into savings','doesn\'t mean losing it','Once that feels safe','the amount can grow','first']},
 ],...(characterRevision?{characterCorrection:{sameAnonymousPersonAcrossScenes:true,connectedAnatomy:['head','neck','torso','arms','phrase-linked hands'],expressions:{'scarcity-question':'concerned','tight-wallet':'worried','knowing-feeling':'guarded','weekly-safekeeping':'relieved'}}}:{}),constraints:['No SVG text, new CTA, price, SFX or transition effect.','No extra coin, running balance, schedule, derived total or implied guaranteed return.','All illustration events resolve from transcript WordBoundary.']},
}))await writeFile(join(out,name),JSON.stringify(value,null,2));

for(const [path,expected] of Object.entries(protectedFiles))if(await hash(path)!==expected)throw new Error('PROTECTED_CHANGED_DURING_PREPARATION: '+path);
await writeFile(join(out,'preparation.json'),JSON.stringify({status:'PASS',day:6,parent,destination:out,revision:characterRevision?'connected-character-and-expression-correction':'rich-story',voiceAndWordBoundaryReused:true,ttsRegenerated:false,protectedFiles:Object.keys(protectedFiles).length,copiedInputs:copied,financeSequences:finance.sequences.map(sequence=>({id:sequence.id,startSec:sequence.startSec,endSec:sequence.endSec})),numericHighlights:highlights.map(item=>({id:item.id,atSec:item.globalStartSec})),numericIntegrity:'PASS',storyScenes:Object.keys(DAY6_RICH_LAYOUT),storyEvents:finance.sequences.reduce((count,sequence)=>count+sequence.motionEvents.length,0),addedAudio:false},null,2));
console.log('Prepared isolated Day6 rich-story benchmark; '+Object.keys(protectedFiles).length+' protected entries verified; voice and WordBoundary bytes reused.');

import { z } from "zod";
import { SourceSpanSchema, resolvePhrase, type ResolvedFinancePlan } from "./finance-motion.js";
import { normalizeContractText as norm, type WordBoundaryTranscript } from "./content-contract.js";
import { groupWordCues, serializeKaraokeAss, type SrtCue } from "../assets/subtitle-tools.js";
import type { Script } from "../render/script-schema.js";

export const HeroCaptionSchema = SourceSpanSchema.extend({sequenceId:z.string(), elementIds:z.array(z.string()).min(1)}).strict();
export type HeroCaption = z.infer<typeof HeroCaptionSchema>;
export function resolveHeroCaptions(spans:HeroCaption[], plan:ResolvedFinancePlan, transcript:WordBoundaryTranscript) {
  const resolved=spans.map(input=>{
    const span=HeroCaptionSchema.parse(input);
    if(span.source!==transcript.sourceScript) throw new Error("HERO_CAPTION: source revision mismatch");
    const seq=plan.sequences.find(s=>s.id===span.sequenceId);
    const elements=span.elementIds.map(id=>seq?.elements.find(e=>e.id===id));
    if(!seq || elements.some(e=>!e || !["HERO","SECTION_MARKER"].includes(e.role ?? "") || !e.copy)) throw new Error("HERO_CAPTION: only explicit hero/section copy may carry captions");
    if(norm(elements.map(e=>e!.copy!.text).join(" "))!==norm(span.sourceSpan)) throw new Error("HERO_CAPTION: exact full spoken span required");
    const timing=resolvePhrase(span,transcript);
    for(const e of elements){
      if(e!.box.x<70 || e!.box.x+e!.box.w>1010 || e!.box.y<240 || e!.box.y+e!.box.h>1340 || (e!.fontSize ?? (e!.size==="heading"?78:46))<40) throw new Error("HERO_CAPTION: safe-area/readability failed");
      const transcriptLinkedReveal=seq.motionEvents.find(ev=>ev.targets.includes(e!.id) && ev.action==="reveal" && ev.atSec<=timing.atSec+.001);
      // A section marker may enter exactly on its WordBoundary; other carried hero copy remains initial.
      if((!e!.initial && !(e!.role==="SECTION_MARKER" && transcriptLinkedReveal)) || seq.startSec>timing.atSec || seq.endSec<timing.endSec) throw new Error("HERO_CAPTION: full phrase must be present throughout its spoken span");
      if(seq.motionEvents.some(ev=>ev.targets.includes(e!.id) && ev.action==="hide" && ev.atSec<timing.endSec)) throw new Error("HERO_CAPTION: text disappears before spoken span ends");
    }
    return {...span,...timing};
  });
  const sorted=[...resolved].sort((a,b)=>a.atSec-b.atSec);
  if(sorted.some((r,i)=>i>0 && r.atSec<sorted[i-1].endSec)) throw new Error("HERO_CAPTION: overlapping suppression");
  return resolved;
}

export function editorialCaptionWords(transcript:WordBoundaryTranscript, spans:ReturnType<typeof resolveHeroCaptions>) {
  const all=transcript.scenes.flatMap(s=>s.words.map(w=>({text:w.text,startMs:w.globalStartMs,endMs:w.globalEndMs})));
  const suppressed:SrtCue[]=[], visible:SrtCue[]=[];
  for(const w of all){
    const overlap=spans.find(s=>w.startMs<s.endSec*1000-.01 && w.endMs>s.atSec*1000+.01);
    if(overlap && (w.startMs<overlap.atSec*1000-.01 || w.endMs>overlap.endSec*1000+.01)) throw new Error("HERO_CAPTION: partial word suppression forbidden");
    (overlap?suppressed:visible).push(w);
  }
  if(suppressed.length+visible.length!==all.length) throw new Error("HERO_CAPTION: word coverage lost");
  return {visible,suppressed,totalWords:all.length};
}

function sentenceBreaks(scene:WordBoundaryTranscript["scenes"][number], voiceText:string):Set<number> {
  const sentences=voiceText.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(value=>value.trim()).filter(Boolean) ?? [voiceText];
  const transcriptTokens=scene.words.flatMap(word=>norm(word.text).split(" ").filter(Boolean));
  const sourceTokens=norm(voiceText).split(" ").filter(Boolean);
  if(transcriptTokens.join(" ")!==sourceTokens.join(" ")) throw new Error(`CAPTION_BOUNDARY_INTEGRITY: source/transcript mismatch ${scene.id}`);
  const tokenEndToWordEnd=new Map<number,number>();let tokenCursor=0;
  for(const word of scene.words){tokenCursor+=norm(word.text).split(" ").filter(Boolean).length;tokenEndToWordEnd.set(tokenCursor,word.globalEndMs);}
  const breaks=new Set<number>();let cumulative=0;
  for(const sentence of sentences.slice(0,-1)){
    cumulative+=norm(sentence).split(" ").filter(Boolean).length;
    const at=tokenEndToWordEnd.get(cumulative);
    if(at===undefined) throw new Error(`CAPTION_BOUNDARY_INTEGRITY: cannot map sentence end ${scene.id}`);
    breaks.add(at);
  }
  return breaks;
}

export function editorialCaptionPhrases(transcript:WordBoundaryTranscript, spans:ReturnType<typeof resolveHeroCaptions>, script:Script) {
  const coverage=editorialCaptionWords(transcript,spans);
  const visibleStarts=new Set(coverage.visible.map(word=>word.startMs));
  const phrases:Array<{sceneId:string,startMs:number,endMs:number,words:SrtCue[]}>=[];
  for(const scene of transcript.scenes){
    const voiceText=script.scenes.find(item=>item.id===scene.id)?.voiceText;
    if(!voiceText) throw new Error(`CAPTION_BOUNDARY_INTEGRITY: missing script scene ${scene.id}`);
    const sentenceEnds=sentenceBreaks(scene,voiceText);
    const runs:SrtCue[][]=[];
    for(const sourceWord of scene.words){
      const word={text:sourceWord.text,startMs:sourceWord.globalStartMs,endMs:sourceWord.globalEndMs};
      if(!visibleStarts.has(word.startMs)) continue;
      const previous=runs.at(-1)?.at(-1);
      if(!previous || sentenceEnds.has(previous.endMs) || word.startMs-previous.endMs>350) runs.push([]);
      runs.at(-1)!.push(word);
    }
    for(const run of runs) for(const words of groupWordCues(run)) phrases.push({sceneId:scene.id,startMs:words[0].startMs,endMs:words.at(-1)!.endMs,words});
  }
  const visibleWordCount=phrases.flatMap(phrase=>phrase.words).length;
  if(visibleWordCount!==coverage.visible.length) throw new Error("CAPTION_BOUNDARY_INTEGRITY: visible word lost or duplicated");
  return phrases;
}

export function editorialKaraokeAss(transcript:WordBoundaryTranscript, spans:ReturnType<typeof resolveHeroCaptions>, script:Script) {
  return serializeKaraokeAss(editorialCaptionPhrases(transcript,spans,script),46,450);
}

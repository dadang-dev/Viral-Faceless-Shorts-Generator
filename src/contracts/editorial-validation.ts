import { assessDominantForegroundHandoff, type ResolvedFinancePlan, type Gate } from "./finance-motion.js";
import type { WordBoundaryTranscript } from "./content-contract.js";
import { normalizeContractText as norm } from "./content-contract.js";
import { editorialCaptionPhrases, type resolveHeroCaptions } from "./hero-captions.js";
import type { Script } from "../render/script-schema.js";

export function assessEditorial(plan:ResolvedFinancePlan, transcript:WordBoundaryTranscript, captions:ReturnType<typeof resolveHeroCaptions>, script:Script) {
  const names=["TEXT_ROLE","VISIBLE_TEXT_REDUNDANCY","HERO_HIERARCHY","SECTION_HIERARCHY","CHAPTER_DEAD_AIR","ICON_SEMANTICS","VISUAL_MODEL_VALIDITY","QUANTITY_AMBIGUITY","DOMINANT_LAYER_COLLISION","CAPTION_BOUNDARY_INTEGRITY","SECTION_CAPTION_REDUNDANCY","TEMPORAL_SPECIFICITY_INTEGRITY","ACTUAL_VS_MENTAL_INTEGRITY","MOTION_SEMANTICS"] as const;
  const checks=Object.fromEntries(names.map(n=>[n,{status:"PASS",errors:[],warnings:[]}])) as unknown as Record<typeof names[number],Gate>;
  const fail=(key:typeof names[number],error:string)=>{checks[key].status="FAIL";checks[key].errors.push(error);};
  const inventory=[];
  const chapters=[];
  try { editorialCaptionPhrases(transcript,captions,script); }
  catch(error) { fail("CAPTION_BOUNDARY_INTEGRITY",String(error)); }
  const handoff=assessDominantForegroundHandoff(plan);
  checks.DOMINANT_LAYER_COLLISION={...handoff};
  for(const s of plan.sequences){
    for(const e of s.elements){
      if((e.copy || e.datumId) && !e.role) fail("TEXT_ROLE",`${s.id}.${e.id}: missing text role`);
      if(e.copy){
        const carried=captions.some(c=>c.sequenceId===s.id && c.elementIds.includes(e.id));
        if(e.role==="HERO" && !carried) fail("VISIBLE_TEXT_REDUNDANCY",`${s.id}.${e.id}: hero copy needs exact scoped caption coverage`);
        if(/you forgot you even signed up for|^do that$|you ve quietly spent|basically nothing/.test(norm(e.copy.text))) fail("VISIBLE_TEXT_REDUNDANCY",`${s.id}.${e.id}: transcript fragment promoted to main text`);
        if(e.kind==="node" && norm(e.copy.text).split(" ").length>4) fail("VISUAL_MODEL_VALIDITY",`${s.id}.${e.id}: sentence fragment is not an entity/process`);
        const entrance=s.motionEvents.find(m=>m.targets.includes(e.id)&&["reveal","stack","draw"].includes(m.action));
        inventory.push({time:[e.initial?s.startSec:entrance?.atSec,s.endSec],mainText:e.numericTypography?e.copy.text.replace(/three habits/i,"3 HABITS"):e.copy.text,role:e.role,spoken:true,subtitleDuplicate:carried?"NO — full exact phrase carried by hero":e.role==="SECTION_MARKER"?"Category/number repeated intentionally as persistent structure":"Source label; sentence remains in subtitle",reason:e.role,sourceSpan:e.copy.sourceSpan,sceneId:e.copy.sceneId});
      }
      if(e.datumId){const d=plan.data.find(d=>d.id===e.datumId)!;inventory.push({time:[s.motionEvents.find(m=>m.targets.includes(e.id)&&["reveal","stack","grow"].includes(m.action))?.atSec,s.endSec],mainText:d.display,role:e.role,spoken:true,subtitleDuplicate:"Numeric data label; subtitle carries full spoken clause",reason:"Quantitative information",source:d});}
      if(e.icon==="habit") fail("ICON_SEMANTICS",`${s.id}.${e.id}: generic refresh arrows do not identify a habit category`);
    }
    for(const update of s.motionEvents.filter(m=>m.action==="update")) inventory.push({time:[update.atSec,s.endSec],mainText:plan.data.find(d=>d.id===update.toDatumId)!.display,role:"DATA_LABEL",spoken:true,subtitleDuplicate:"Data state",reason:"Same-object mental price label",source:plan.data.find(d=>d.id===update.toDatumId)});
    const marker=s.elements.find(e=>e.role==="SECTION_MARKER" && /^number (one|two|three)$/i.test(e.copy?.text ?? ""));
    if(marker){
      if((marker.fontSize??0)<90 || !s.motionEvents.some(m=>m.targets.includes(marker.id)&&m.pose?.fontSize)) fail("SECTION_HIERARCHY",`${s.id}: marker must be dominant then settle into header`);
      const start=transcript.scenes.find(t=>t.id===marker.copy!.sceneId)!.words[0].globalStartMs/1000;
      const first=s.motionEvents.find(m=>["reveal","stack","draw"].includes(m.action)&&m.targets.some(id=>s.elements.find(e=>e.id===id)?.icon));
      const wait=first?first.atSec-start:Infinity;
      chapters.push({sequence:s.id,markerStart:start,firstEntity:first?.atSec,waitSec:wait});
      if(wait>1.2) fail("CHAPTER_DEAD_AIR",`CHAPTER_DEAD_AIR_WARNING: ${s.id}: ${wait.toFixed(3)}s before first entity`);
      const headings=s.elements.filter(e=>e.role==="SECTION_MARKER" && e.copy);
      const carried=captions.find(c=>c.sequenceId===s.id);
      if(!carried || headings.some(e=>!carried.elementIds.includes(e.id))) fail("SECTION_CAPTION_REDUNDANCY",`${s.id}: exact full section marker must carry its caption`);
    }
    const appObjects=s.elements.filter(e=>e.entityGroup==="apps");
    if(appObjects.length){
      const total=plan.data.find(d=>d.unit==="apps");
      if(appObjects.length!==total?.value || s.elements.some(e=>e.kind==="markers" && plan.data.find(d=>d.id===e.datumId)?.unit==="apps")) fail("QUANTITY_AMBIGUITY",`${s.id}: subscription objects must equal total, not three plus five`);
    }
    for(const week of s.elements.filter(e=>e.weekSlots)) {
      if(week.frequencyMode!=="count-only") fail("TEMPORAL_SPECIFICITY_INTEGRITY",`${s.id}.${week.id}: weekly count must not imply named/specific days`);
      const original=s.elements.filter(e=>e.kind==="node" && e.icon===week.icon);
      if(original.length && (original.length!==1 || week.retainedMarkerId!==original[0].id)) fail("QUANTITY_AMBIGUITY",`${s.id}: original purchase must become a weekly event, not an additional object`);
      if(week.retainedMarkerId && !s.motionEvents.some(m=>m.targets.includes(week.retainedMarkerId!) && m.pose?.box && Math.abs(m.atSec-(s.motionEvents.find(v=>v.targets.includes(week.id)&&v.action==="reveal")?.atSec ?? Infinity))<.001)) fail("QUANTITY_AMBIGUITY",`${s.id}: retained object must move into the week at the same transcript event`);
      const object=original[0], motion=s.motionEvents.find(m=>m.targets.includes(week.retainedMarkerId ?? "")&&m.pose?.box);
      if(object && motion?.pose?.box){
        const a=object.box,b=motion.pose.box;
        const prices=s.elements.filter(e=>e.kind==="metric"&&plan.data.find(d=>d.id===e.datumId)?.unit==="USD");
        for(let k=0;k<=30;k++){
          const t=k/30, horizontal=motion.pose.route==="horizontal-first";
          const tx=horizontal?Math.min(1,t/.43):t,ty=horizontal?Math.max(0,(t-.43)/.57):t;
          const moving={x:a.x+(b.x-a.x)*tx,y:a.y+(b.y-a.y)*ty,w:a.w+(b.w-a.w)*tx,h:a.h+(b.h-a.h)*tx};
          if(prices.some(p=>moving.x<p.box.x+p.box.w && moving.x+moving.w>p.box.x && moving.y<p.box.y+p.box.h && moving.y+moving.h>p.box.y)) {fail("VISUAL_MODEL_VALIDITY",`${s.id}: retained object path obscures purchase price`);break;}
        }
      }
    }
    const mental=s.elements.find(e=>e.semanticState==="mental"), actual=s.elements.find(e=>e.semanticState==="actual");
    if(mental || actual){
      if(!mental || !actual || mental.id===actual.id) fail("ACTUAL_VS_MENTAL_INTEGRITY",`${s.id}: actual and mental values need separate simultaneous states`);
      else {
        const mentalDatum=plan.data.find(d=>d.id===mental.datumId), actualDatum=plan.data.find(d=>d.id===actual.datumId);
        if(mentalDatum?.qualifier!=="approx" || actualDatum?.qualifier!=="exact") fail("ACTUAL_VS_MENTAL_INTEGRITY",`${s.id}: actual must stay exact and mental must stay approximate`);
        if(s.motionEvents.some(event=>event.action==="update" && event.targets.includes(actual.id))) fail("ACTUAL_VS_MENTAL_INTEGRITY",`${s.id}: mental state may not replace actual state`);
        if(s.motionEvents.some(event=>event.action==="hide" && event.targets.includes(actual.id) && event.atSec<s.endSec)) fail("ACTUAL_VS_MENTAL_INTEGRITY",`${s.id}: actual value disappears before consequence completes`);
      }
    }
    if(s.id==="subscriptions"){
      const dims=s.motionEvents.filter(event=>event.action==="focus" && event.pose?.opacity!==undefined && event.pose.opacity<1 && ["streaming","fitness","cloud"].some(id=>event.targets.includes(id)));
      if(dims.length<3) fail("MOTION_SEMANTICS","subscriptions: forgetting clause needs progressive semantic de-emphasis");
    }
    if(s.id==="convenience"){
      const price=s.motionEvents.find(event=>event.id==="price");
      const orderReveal=s.motionEvents.find(event=>event.id==="ordering" && event.action==="reveal");
      if(!price || !orderReveal || orderReveal.atSec>=price.atSec || !s.elements.some(e=>e.connectsTo==="object")) fail("MOTION_SEMANTICS","convenience: order action must visibly progress before $10");
    }
  }
  const hook=plan.sequences.find(s=>s.id==="hook");
  if(hook){const payload=hook.elements.find(e=>e.numericTypography);if(!payload || hook.elements.some(e=>e.id!==payload.id && (e.fontSize??0)>=(payload.fontSize??0))) fail("HERO_HIERARCHY","3 HABITS must dominate supporting copy");}
  checks.CHAPTER_DEAD_AIR.evidence=chapters;
  checks.CAPTION_BOUNDARY_INTEGRITY.evidence={segmentation:"per scene and sentence punctuation",chapterMarkers:["scene-3","scene-6","scene-9"]};
  return {status:Object.values(checks).some(c=>c.status==="FAIL")?"FAIL" as const:"PASS" as const,checks,inventory,chapters};
}

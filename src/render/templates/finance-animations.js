// Opt-in v1.2. Only compiler-supported transforms; all event positions are resolved WordBoundary times.
(function () {
  const timeline = window.__timelines["news-video"];
  document.querySelectorAll(".fm-sequence").forEach(scene => {
    const events = JSON.parse(scene.dataset.financeEvents);
    const nodes = Array.from(scene.querySelectorAll(".fm-element"));
    const find = id => nodes.find(el => el.dataset.elementId === id);
    const links = Array.from(scene.querySelectorAll(".fm-link"));
    events.forEach(event => {
      const at = event.atSec;
      event.targets.forEach(id => {
        const el = find(id);
        if (!el) throw new Error("MODEL_NOT_COMMUNICATED: " + id);
        if (["reveal", "stack", "grow", "draw"].includes(event.action)) {
          const x = event.transition === "push-stack" ? 48 : event.transition === "split-expand" ? 40 : 0;
          const y = event.transition === "directional-progression" ? -24 : 16;
          timeline.fromTo(el, { opacity:0, x:x, y:y }, { opacity:event.revealOpacity ?? 1, x:0, y:0, duration:.36 }, at);
          if (event.transition === "stat-punch") {
            timeline.fromTo(el,{scale:.96},{scale:1.06,duration:.18},at);
            timeline.to(el,{scale:1,duration:.24},at+.18);
          }
          const fill = el.querySelector(".fm-bar-fill");
          if (fill) {
            const vertical = el.classList.contains("fm-vertical");
            timeline.fromTo(fill, vertical ? {scaleY:0} : {scaleX:0}, vertical ? {scaleY:Number(el.dataset.ratio),duration:.48} : {scaleX:Number(el.dataset.ratio),duration:.48}, at);
          }
          links.filter(link => link.dataset.to === id).forEach(link => {
            timeline.set(link, {opacity:1}, at);
            timeline.fromTo(link.querySelector(".fm-link-draw"), {scaleY:0}, {scaleY:1,duration:.36}, at);
          });
        } else if (event.action === "hide") {
          timeline.to(el, {opacity:0, duration:.18}, at);
          links.filter(link => link.dataset.from === id || link.dataset.to === id).forEach(link => timeline.to(link,{opacity:0,duration:.18},at));
        } else if (event.action === "focus") {
          if (event.pose) {
            const b=event.pose.box;
            if(b && el.classList.contains("fm-node")) timeline.to(el,{padding:b.w<180?8:24,duration:.42},at);
            if(b && event.pose.route === "horizontal-first") {
              timeline.to(el,{left:b.x,width:b.w,height:b.h,duration:.18},at);
              timeline.to(el,{top:b.y,duration:.24},at+.18);
            } else timeline.to(el,{...(b ? {left:b.x,top:b.y,width:b.w,height:b.h} : {}), ...(event.pose.opacity !== undefined ? {opacity:event.pose.opacity} : {}),duration:.42},at);
            if(event.pose.fontSize) timeline.to(el.querySelector(".fm-copy"),{fontSize:event.pose.fontSize,duration:.42},at);
          }
          const dimming = event.pose && event.pose.opacity !== undefined && event.pose.opacity < 1;
          nodes.forEach(n => { const ring = n.querySelector(".fm-focus-ring"); if (ring) timeline.to(ring,{opacity:!dimming && n === el ? 1 : 0,duration:.18},at); });
        } else if (event.action === "punch") {
          timeline.to(el,{scale:1.1,duration:.18},at);
          timeline.to(el,{scale:1,duration:.24},at + .18);
        } else if (event.action === "interrupt") {
          links.forEach(link => timeline.to(link,{opacity:0,duration:.18},at));
          const ring = el.querySelector(".fm-focus-ring");
          if (ring) timeline.to(ring,{opacity:1,duration:.18},at);
        } else if (event.action === "update") {
          const steps = Array.from(el.querySelectorAll(".fm-metric-step, .fm-bar-step"));
          if (!steps.length) throw new Error("MODEL_NOT_COMMUNICATED: update requires exact metric steps");
          if(scene.dataset.editorial === "true") {
            steps.forEach(step=>{
              const incoming=step.dataset.step===event.toDatumId;
              timeline.to(step,{opacity:incoming?1:0,y:incoming?0:-16,duration:incoming?.15:.09},at+(incoming?.09:0));
            });
          } else steps.forEach(step => timeline.to(step,{opacity:step.dataset.step === event.toDatumId ? 1 : 0,y:step.dataset.step === event.toDatumId ? 0 : -16,duration:.24},at));
          const fill = el.querySelector(".fm-bar-fill");
          if (fill) {
            const ratio = JSON.parse(fill.dataset.ratios)[event.toDatumId];
            timeline.to(fill,el.classList.contains("fm-vertical") ? {scaleY:ratio,duration:.42} : {scaleX:ratio,duration:.42},at);
          }
        }
      });
    });
  });
})();

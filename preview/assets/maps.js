/* Saved locations only: local data, no external requests or inline styles. */
'use strict';
(async () => {
 const host = document.querySelector('[data-map]');
 if (!host) return;
 const listLink = document.querySelector('[data-pin-list-link]');
 listLink?.addEventListener('click', () => { const list = document.getElementById('saved-pins'); if (list) list.open = true; });
 const status = document.querySelector('[data-basemap-status]');
 if (status) status.textContent = 'Use the saved-place list below as the primary way to choose a place and open directions.';
 try {
  const response = await fetch(`assets/${host.dataset.map}.json`);
  if (!response.ok) throw new Error('Local data unavailable');
  const {pins} = await response.json();
  const select = document.querySelector('[data-map-group]');
  const make = tag => document.createElementNS('http://www.w3.org/2000/svg', tag);
  function update() {
   const shown = pins.filter(locationPin => !select || select.value === 'all' || locationPin.group === select.value);
   const svg = make('svg'); svg.setAttribute('viewBox','0 0 800 400'); svg.setAttribute('role','img'); svg.setAttribute('aria-label',`${shown.length} saved locations. Use the locationPin list for names and directions.`);
   if (shown.length) {
    const xs=shown.map(p=>p.lng), ys=shown.map(p=>p.lat);
    const left=Math.min(...xs), right=Math.max(...xs), top=Math.max(...ys), bottom=Math.min(...ys);
    const median = values => { const v=values.sort((a,b)=>a-b); return (v[Math.floor((v.length-1)/2)]+v[Math.ceil((v.length-1)/2)])/2; };
    for (const [group,label] of [['osaka','Osaka'],['ise','Ise-Shima'],['nagoya','Nagoya'],['fuji','Mount Fuji'],['tokyo','Tokyo']]) {
     const area=pins.filter(p=>(p.group===group || (group==='fuji' && p.group==='yamanaka')));
     if (!area.length) continue;
     const text=make('text');text.textContent=label;text.setAttribute('class','area-label');
     const labelX=Math.max(8,Math.min(792,24+(median(area.map(p=>p.lng))-left)/Math.max(right-left,0.01)*752));
     text.setAttribute('x',String(labelX));text.setAttribute('text-anchor',labelX>650?'end':labelX<150?'start':'middle');
     text.setAttribute('y',String(Math.max(16,Math.min(390,24+(top-median(area.map(p=>p.lat)))/Math.max(top-bottom,0.01)*352-12))));svg.append(text);
    }
    for (const locationPin of shown) {
     const a=make('a'); a.setAttribute('href',locationPin.href); a.setAttribute('target','_blank'); a.setAttribute('rel','noopener noreferrer');
     const dot=make('circle'); dot.setAttribute('cx',String(24+(locationPin.lng-left)/Math.max(right-left,0.01)*752)); dot.setAttribute('cy',String(24+(top-locationPin.lat)/Math.max(top-bottom,0.01)*352)); dot.setAttribute('r',locationPin.hotel?'8':'6'); dot.setAttribute('class',locationPin.hotel?'locationPin hotel':'locationPin');
     const title=make('title'); title.textContent=locationPin.name; dot.append(title); a.append(dot); svg.append(a);
    }
   }
   host.replaceChildren(svg);
   const count=document.querySelector('[data-map-count]'); if(count)count.textContent=`${shown.length} ${shown.length === 1 ? 'pin' : 'pins'}`;
  }
  select?.addEventListener('change',update); update();
 } catch (_) { host.textContent='Saved locations could not load. Use the complete saved pin list below.'; }
})();

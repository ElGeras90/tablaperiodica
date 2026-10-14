(() => {
  'use strict';
  const baseElements = window.PERIODIC_ELEMENTS || [];
  const byNumber = new Map(baseElements.map(el => [el.number, el]));
  const $ = id => document.getElementById(id);
  const modal = $('scienceModal');
  const dialog = modal.querySelector('.science-dialog');
  const photoCatalog = new Map();
  const scientificCatalog = new Map();
  let activeNumber = Number(window.PERIODIC_SELECTED || 1);
  let visualMode = 'sample';
  let pubchemReady = false;
  let photoReady = false;
  let pubchemError = false;
  let photoError = false;
  let lastFocus = null;
  const nf = new Intl.NumberFormat('es-MX', {maximumFractionDigits:6});
  const field = (obj, key) => obj && obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '' ? obj[key] : null;
  const print = value => value === null || value === undefined || value === '' ? 'No disponible' : String(value);
  const fmt = value => { if (value === null || value === undefined || value === '') return 'No disponible'; const n = Number(value); return Number.isFinite(n) ? nf.format(n) : String(value); };
  const family = {alcalino:'Metal alcalino', alcalinoterreo:'Metal alcalinotérreo', transicion:'Metal de transición', postransicion:'Metal postransición', metaloide:'Metaloide', nometal:'No metal', halogeno:'Halógeno', noble:'Gas noble', lantanido:'Lantánido', actinido:'Actínido'};
  const translations = {Gas:'Gas',Solid:'Sólido',Liquid:'Líquido',Unknown:'No determinado'};
  // Small verified sample-photo set for the initial view while Wikimedia's catalog loads.
  // Wikimedia photo credits are displayed; do not replace missing photos with generated representations.
  const initialPhotos = {
    1:{image:{url:'https://upload.wikimedia.org/wikipedia/commons/d/d9/Hydrogenglow.jpg',title:'Vial of glowing ultrapure hydrogen (gas under electrical excitation)',attribution:'Jurii, CC BY 3.0, vía Wikimedia Commons (images-of-elements.com)'}},
    2:{image:{url:'https://upload.wikimedia.org/wikipedia/commons/0/00/Helium-glow.jpg',title:'Vial of glowing ultrapure helium under electrical excitation',attribution:'Jurii, CC BY 3.0, vía Wikimedia Commons (images-of-elements.com)'}},
    4:{image:{url:'https://upload.wikimedia.org/wikipedia/commons/e/e2/Beryllium_%28Be%29.jpg',title:'Muestra física de berilio',attribution:'Hi-Res Images of Chemical Elements, CC BY 3.0, vía Wikimedia Commons'}},
    5:{image:{url:'https://upload.wikimedia.org/wikipedia/commons/a/a2/Boron.jpg',title:'Boro cristalino',attribution:'Jurii, CC BY 3.0, vía Wikimedia Commons'}},
    10:{image:{url:'https://upload.wikimedia.org/wikipedia/commons/f/f8/Neon-glow.jpg',title:'Neón iluminado en tubo de descarga',attribution:'Jurii, CC BY 3.0, vía Wikimedia Commons'}},
    11:{image:{url:'https://upload.wikimedia.org/wikipedia/commons/2/27/Na_%28Sodium%29.jpg',title:'Sodio metálico',attribution:'Wikimedia Commons (autor y licencia en página original)'}},
    13:{image:{url:'https://upload.wikimedia.org/wikipedia/commons/3/3e/Aluminium.jpg',title:'Lámina de aluminio',attribution:'Jurii, CC BY 3.0, vía Wikimedia Commons'}},
    14:{image:{url:'https://upload.wikimedia.org/wikipedia/commons/2/2c/Silicon.jpg',title:'Fragmento de silicio ultrapuro',attribution:'Jurii, CC BY 3.0, vía Wikimedia Commons'}}
  };
  for (const [n, val] of Object.entries(initialPhotos)) photoCatalog.set(Number(n), val);
  const stateFormat = (data, el) => print(translations[field(data,'StandardState')] || el.phase);
  const stateDetails = data => data?.__origin==='complementary' ? 'FUENTE COMPLEMENTARIA · DATOS NO CONTRASTADOS CON PUBCHEM' : pubchemReady ? (data ? 'DATOS PUBCHEM / NIH · CONSULTA ACTUAL' : 'SIN REGISTRO EN PUBCHEM') : (pubchemError ? 'DATOS BÁSICOS · PUBCHEM NO DISPONIBLE' : 'CARGANDO PROPIEDADES DE PUBCHEM…');
  function fallbackScienceIfNeeded() {
    if(!pubchemError || pubchemReady) return;
    for(const el of baseElements) {
      const aux=photoCatalog.get(el.number);
      if(!aux || scientificCatalog.has(el.number))continue;
      const safe = el.number < 104;
      const ion = Array.isArray(aux.ionization_energies) ? aux.ionization_energies[0] : null;
      const radius = aux.atomic_radii?.van_der_waals;
      // Secondary dataset reports ionization and electron affinity in kJ/mol.
      // Convert to eV per particle only when the energy is given numerically.
      const toEV = kJmol => typeof kJmol === 'number' && Number.isFinite(kJmol) ? String(Math.round(kJmol/96.4853321233*10000)/10000) : '';
      scientificCatalog.set(el.number,{
        __origin:'complementary',AtomicNumber:String(el.number),Symbol:el.symbol,
        AtomicMass:field(aux,'atomic_mass')===null?'':String(aux.atomic_mass),
        ElectronConfiguration:field(aux,'electron_configuration_semantic')||field(aux,'electron_configuration')||'',
        Electronegativity:field(aux,'electronegativity_pauling')??'',
        AtomicRadius:Array.isArray(radius)&&radius.length?radius[0]:'',
        IonizationEnergy:safe?toEV(ion):'',ElectronAffinity:safe?toEV(aux.electron_affinity):'',
        OxidationStates:'', StandardState:safe ? (aux.phase||''):'',
        MeltingPoint:safe?(aux.melt??''):'',BoilingPoint:safe?(aux.boil??''):'',
        Density:safe?(aux.density_g_cm3??''):'',GroupBlock:field(aux,'category')||'',YearDiscovered:''
      });
    }
  }

  function safePhoto(media) {
    const image = media?.image;
    const url = image?.url;
    if (typeof url !== 'string' || !/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//i.test(url)) return null;
    if (!/\.(png|jpe?g|webp)(?:\?.*)?$/i.test(url)) return null;
    if (!image?.title || /no image found|placeholder|illustration|drawing|artist|predicted|transactinoid/i.test(image.title)) return null;
    return {url, title:String(image.title).slice(0,300), credit:String(image.attribution || 'Wikimedia Commons; revisar licencia en archivo original').slice(0,700)};
  }
  function photoFor(n) {return safePhoto(photoCatalog.get(n));}
  function showSpecimen(img, placeholder, textEl, n, setText) {
    const el = byNumber.get(n);
    const photo = photoFor(n);
    img.onload = null; img.onerror = null;
    img.hidden = true; img.removeAttribute('src');
    placeholder.hidden = false;
    if (!photo) {
      const msg = n >= 104 || n === 85 || n === 87 ?
        'No hay fotografía verificable de una muestra macroscópica del elemento.' :
        (photoError ? 'Catálogo fotográfico no disponible; consulta la fuente original.' : (photoReady ? 'No hay fotografía de muestra verificable en el catálogo.' : 'Buscando fotografía documental…'));
      setText(msg);
      return;
    }
    setText('Cargando fotografía de Wikimedia Commons…');
    img.alt = `Muestra real de ${el.name}: ${photo.title}`;
    img.onload = () => {if (activeNumber !== n) return; img.hidden = false;placeholder.hidden = true;};
    img.onerror = () => {if (activeNumber !== n) return;img.hidden = true;placeholder.hidden = false;setText('Fotografía no accesible. Abre la imagen original para comprobarla.');};
    img.src = photo.url;
  }
  function setVisualMode(mode) {
    visualMode = mode;
    document.querySelectorAll('.visual-btn').forEach(b => {
      const yes = b.dataset.visual === mode;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));
    });
    $('sampleVisual').hidden = mode !== 'sample';
    $('atomVisual').hidden = mode !== 'atom';
  }
  function refreshSide() {
    const el = byNumber.get(activeNumber);if(!el)return;
    const d = scientificCatalog.get(activeNumber);
    $('dataStatus').textContent = stateDetails(d);
    $('propMass').textContent = d && field(d,'AtomicMass') !== null ? `${field(d,'AtomicMass')} u` : `${fmt(el.mass)} u (aprox.)`;
    $('propPhase').textContent = stateFormat(d,el);
    $('propConfig').textContent = print(field(d,'ElectronConfiguration'));
    $('propElectronegativity').textContent = fmt(field(d,'Electronegativity'));
    $('sampleSymbol').textContent = el.symbol;
    showSpecimen($('sampleImage'),$('samplePlaceholder'),$('sampleMessage'),activeNumber,t => $('sampleMessage').textContent=t);
    $('sampleCaption').textContent = photoFor(activeNumber) ? 'FOTOGRAFÍA DE UNA MUESTRA FÍSICA' : 'SIN FOTOGRAFÍA VERIFICABLE';
  }
  function fahrenK(k) {
    if (k === null || k === undefined || k === '') return 'No disponible';
    const num = Number(k);if(!Number.isFinite(num))return 'No disponible';
    return `${fmt(num)} K   ·   ${nf.format(Math.round((num-273.15)*100)/100)} °C`;
  }
  function makeGridCell(label, val, description) {
    const div = document.createElement('div');div.className='scientific-cell';
    const lbl = document.createElement('dt');lbl.textContent=label;
    const value = document.createElement('dd');value.textContent=print(val);
    if (val === 'No disponible' || val === null || val === undefined) value.className='field-unavailable';
    div.append(lbl,value);
    if(description){const p=document.createElement('small');p.textContent=description;div.appendChild(p);}
    return div;
  }
  function makeScienceGroup(label, fields) {
    const group = document.createElement('section');group.className='scientific-group';
    const h = document.createElement('h3');h.textContent=label;group.appendChild(h);
    const grid = document.createElement('dl');grid.className='scientific-rows';
    fields.forEach(([name, value, note])=>grid.appendChild(makeGridCell(name, value, note)));
    group.appendChild(grid);return group;
  }
  function renderShells(shells) {
    const dst=$('electronShells');dst.replaceChildren();
    if (!Array.isArray(shells) || !shells.length || !shells.every(x=>Number.isInteger(x)&&x>=0)) {
      dst.textContent='Distribución por capas no disponible en la fuente complementaria.';
      return;
    }
    shells.forEach((electrons,index)=>{
      const part=document.createElement('span');part.className='electron-shell';
      const sym=document.createElement('strong');sym.textContent=`${'KLMNOPQ'[index] || (index+1)}`;
      const val=document.createElement('span');val.textContent=`${electrons} e⁻`;
      part.append(sym,val);dst.appendChild(part);
    });
  }
  function refreshModal() {
    if(modal.getAttribute('aria-hidden')==='true')return;
    const el = byNumber.get(activeNumber);if(!el)return;
    const d=scientificCatalog.get(activeNumber);
    const aux=photoCatalog.get(activeNumber);
    $('modalName').textContent = el.name;
    $('modalNum').textContent = String(el.number).padStart(3,'0');
    $('modalSubtitle').textContent = `${el.symbol}   ·   ${family[el.category] || el.category}   ·   ${stateFormat(d,el)}`;
    $('modalPlaceholderSymbol').textContent=el.symbol;
    $('modalDataStatus').textContent=stateDetails(d);
    $('modalAppearance').textContent=print(field(aux,'appearance'));
    showSpecimen($('modalImage'),$('modalImagePlaceholder'),$('modalPlaceholderText'),activeNumber,t=>$('modalPlaceholderText').textContent=t);
    const photo=photoFor(activeNumber);
    $('modalPhotoTitle').textContent=photo?.title || 'No hay fotografía de una muestra verificable para este elemento.';
    $('modalPhotoCredit').textContent=photo?.credit || 'Para elementos sintéticos o extremadamente inestables, la fotografía física puede no existir.';
    $('modalPhotoLink').hidden=!photo;
    if(photo)$('modalPhotoLink').href=photo.url;
    const grid=$('scienceGrid');grid.replaceChildren();
    const mass = field(d,'AtomicMass');
    const unstable = [43,61].includes(el.number)||el.number>=84;
    grid.appendChild(makeScienceGroup('Identificación y clasificación',[
      ['Número atómico',String(el.number)], ['Símbolo',el.symbol],['Masa atómica',mass === null ? `${fmt(el.mass)} u (referencial)` : `${mass} u`,unstable?'Para este radionúclido no siempre existe un peso atómico estándar; puede citarse el número de masa de un isótopo.':null],
      ['Familia química',family[el.category]||el.category],['Grupo',el.group??'Serie f / posición convencional'],['Período',el.period],['Bloque electrónico',field(aux,'block') || (el.category==='lantanido'||el.category==='actinido'?'f':'No disponible')], ['Estado estándar',stateFormat(d,el)],['Descubrimiento',field(d,'YearDiscovered')||'No disponible'],['Descubridor (fuente complementaria)',field(aux,'discovered_by')||'No disponible']
    ]));
    grid.appendChild(makeScienceGroup('Estructura y química',[
      ['Protones',el.number],['Electrones (átomo neutro)',el.number],['Neutrones','Depende del isótopo'],
      ['Configuración electrónica',field(d,'ElectronConfiguration')],['Electronegatividad de Pauling',fmt(field(d,'Electronegativity'))],['Estados de oxidación',field(d,'OxidationStates')],['Radio de van der Waals',field(d,'AtomicRadius')===null?'No disponible':`${fmt(field(d,'AtomicRadius'))} pm`, 'El campo AtomicRadius de PubChem corresponde al radio de van der Waals.'], ['Primera energía de ionización',field(d,'IonizationEnergy')===null?'No disponible':`${fmt(field(d,'IonizationEnergy'))} eV`], ['Afinidad electrónica',field(d,'ElectronAffinity')===null?'No disponible':`${fmt(field(d,'ElectronAffinity'))} eV`]
    ]));
    grid.appendChild(makeScienceGroup('Propiedades físicas',[
      ['Punto de fusión',fahrenK(field(d,'MeltingPoint'))],['Punto de ebullición',fahrenK(field(d,'BoilingPoint'))],['Densidad',field(d,'Density')===null?'No disponible':`${fmt(field(d,'Density'))} g/cm³`,'Las condiciones de referencia varían por elemento; se muestra el valor publicado por PubChem.'],
      ['Calor molar (fuente complementaria)',field(aux,'molar_heat')===null?'No disponible':`${fmt(field(aux,'molar_heat'))} J/(mol·K)`], ['Aspecto macroscópico',field(aux,'appearance')]
    ]));
    renderShells(aux?.shells);
    $('modalPrevious').disabled = activeNumber === 1;
    $('modalNext').disabled = activeNumber === 118;
  }
  function openSheet() {
    lastFocus=document.activeElement;
    modal.setAttribute('aria-hidden','false');document.body.classList.add('science-open');refreshModal();dialog.focus();
  }
  function closeSheet() {
    modal.setAttribute('aria-hidden','true');document.body.classList.remove('science-open');
    if(lastFocus&&document.contains(lastFocus))lastFocus.focus();
  }
  window.addEventListener('periodic:select',(event)=>{
    activeNumber=event.detail.number;refreshSide();refreshModal();
  });
  document.querySelectorAll('.visual-btn').forEach(b=>b.addEventListener('click',()=>setVisualMode(b.dataset.visual)));
  $('openSheet').addEventListener('click',openSheet);
  $('closeSheet').addEventListener('click',closeSheet);
  $('modalPrevious').addEventListener('click',()=>window.PERIODIC_SELECT?.(Math.max(1,activeNumber-1)));
  $('modalNext').addEventListener('click',()=>window.PERIODIC_SELECT?.(Math.min(118,activeNumber+1)));
  modal.addEventListener('click',e=>{if(e.target===modal)closeSheet();});
  document.addEventListener('keydown',e=>{
    if(modal.getAttribute('aria-hidden')==='false') {
      if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeSheet();}
      if(e.key==='ArrowRight' && !['INPUT','BUTTON'].includes(document.activeElement.tagName)){window.PERIODIC_SELECT?.(Math.min(118,activeNumber+1));}
      if(e.key==='ArrowLeft' && !['INPUT','BUTTON'].includes(document.activeElement.tagName)){window.PERIODIC_SELECT?.(Math.max(1,activeNumber-1));}
      if(e.key==='Tab') {
        const targets=[...dialog.querySelectorAll('button:not(:disabled),a[href]:not([hidden])')].filter(a=>a.offsetParent!==null);
        if(targets.length){if(e.shiftKey && document.activeElement===targets[0]){e.preventDefault();targets[targets.length-1].focus();}else if(!e.shiftKey && document.activeElement===targets[targets.length-1]){e.preventDefault();targets[0].focus();}}
      }
    }
  },true);
  function fetchJSON(url,ms=13000){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),ms);
    return fetch(url,{mode:'cors',signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}).finally(()=>clearTimeout(timer));
  }
  const pubchem = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON';
  const photographicSource = 'https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json';
  async function loadData() {
    // An optional local snapshot allows the published site to work without remote APIs.
    // It can be generated with: python actualizar_fuentes.py
    let local=null;
    try { local=await fetchJSON('./science-cache.json',2500); } catch { /* Optional file absent. */ }
    const pubchemCall = local?.pubchem?.Table?.Row?.length>=118 ? Promise.resolve(local.pubchem) : fetchJSON(pubchem);
    const photoCall = local?.photos?.elements?.length>=118 ? Promise.resolve(local.photos) : fetchJSON(photographicSource);
    await Promise.allSettled([
      pubchemCall.then(json=>{
        const columns=json?.Table?.Columns?.Column;
        const rows=json?.Table?.Row;
        if(!Array.isArray(columns)||!Array.isArray(rows)||rows.length<118)throw new Error('Formato PubChem incompleto');
        for(const r of rows){
          const d=Object.fromEntries(columns.map((col,i)=>[col,r.Cell?.[i]??'']));
          const num=Number(d.AtomicNumber);
          if(byNumber.get(num)?.symbol===d.Symbol)scientificCatalog.set(num,d);
        }
        pubchemReady = scientificCatalog.size>=118;
        if(!pubchemReady)throw new Error('No coinciden los 118 registros');
        refreshSide();refreshModal();
      }).catch(e=>{pubchemError=true;fallbackScienceIfNeeded();refreshSide();refreshModal();console.warn('PubChem no disponible:',e.message);}),
      photoCall.then(json=>{
        if(!Array.isArray(json?.elements)||json.elements.length<118)throw new Error('Formato catálogo incompleto');
        for(const d of json.elements){if(byNumber.get(d.number)?.symbol===d.symbol)photoCatalog.set(d.number,d);}
        photoReady=true;fallbackScienceIfNeeded();refreshSide();refreshModal();
      }).catch(e=>{photoError=true;refreshSide();refreshModal();console.warn('Imágenes no disponibles:',e.message);})
    ]);
  }
  setVisualMode(visualMode);refreshSide();loadData();
})();
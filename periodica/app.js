(() => {
  'use strict';
  const elements = window.PERIODIC_ELEMENTS || [];
  if (elements.length !== 118) throw new Error('Se esperaban 118 elementos químicos.');
  const $ = (id) => document.getElementById(id);
  const scene = $('scene');
  const world = $('world');
  const search = $('search');
  const categories = $('categories');
  const countLabel = $('countLabel');
  const zoomLabel = $('zoomLabel');
  const familyInfo = {
    todos:         { label:'Todos', color:'#bcfa65' },
    alcalino:      { label:'Alcalinos', color:'#fd8673' },
    alcalinoterreo:{ label:'Alcalinotérreos', color:'#f2bb6d' },
    transicion:    { label:'Metales de transición', color:'#6accd8' },
    postransicion: { label:'Otros metales', color:'#7d9ce8' },
    metaloide:     { label:'Metaloides', color:'#c5a5ef' },
    nometal:       { label:'No metales', color:'#a5e5a4' },
    halogeno:      { label:'Halógenos', color:'#f1a9ca' },
    noble:         { label:'Gases nobles', color:'#c8a4fb' },
    lantanido:     { label:'Lantánidos', color:'#f2df82' },
    actinido:      { label:'Actínidos', color:'#f5a476' }
  };
  const descriptions = {
    1:'El elemento más ligero y el más abundante del universo. Presente en las estrellas y en el agua.',
    2:'Gas noble muy ligero. Se utiliza en criogenia y para enfriar equipos científicos.',
    3:'Metal alcalino ligero utilizado en baterías recargables y otras tecnologías de almacenamiento.',
    4:'Metal ligero y rígido empleado en aplicaciones aeroespaciales y componentes especializados.',
    5:'Metaloide esencial en vidrios borosilicatos, detergentes y materiales avanzados.',
    6:'Base de la química orgánica y de la vida. Forma diamante, grafito y grafeno.',
    7:'Gas mayoritario de la atmósfera terrestre y esencial en proteínas y ácidos nucleicos.',
    8:'Indispensable para la respiración de muchos organismos y un componente del agua.',
    9:'Halógeno muy reactivo, utilizado en compuestos para materiales y diversas industrias.',
    10:'Gas noble que emite un brillo característico en tubos de descarga eléctrica.',
    11:'Metal alcalino muy reactivo que forma parte de la sal común como ion sodio.',
    12:'Metal ligero presente en aleaciones y esencial en numerosas reacciones biológicas.',
    13:'Metal ligero, resistente a la corrosión, ampliamente usado en transporte y construcción.',
    14:'Semiconductor fundamental para la electrónica, los chips y las celdas solares.',
    15:'Elemento esencial en el ADN, el ATP, los fertilizantes y numerosos minerales.',
    16:'No metal presente en aminoácidos, minerales y procesos industriales.',
    17:'Halógeno utilizado en desinfección y en la fabricación de numerosos productos químicos.',
    18:'Gas noble presente en la atmósfera y utilizado para crear ambientes inertes.',
    19:'Metal alcalino esencial para el funcionamiento de nervios y músculos.',
    20:'Componente de huesos y dientes; está presente en minerales y en materiales de construcción.',
    26:'Metal de transición esencial para fabricar acero y numerosas estructuras.',
    29:'Excelente conductor eléctrico, ampliamente usado en cables y circuitos.',
    30:'Metal utilizado para galvanizar el acero y protegerlo contra la corrosión.',
    35:'Uno de los pocos elementos líquidos cerca de la temperatura ambiente; pertenece a los halógenos.',
    36:'Gas noble utilizado en iluminación y equipos especializados.',
    47:'Metal precioso de alta conductividad eléctrica y térmica.',
    53:'Halógeno empleado en desinfectantes, análisis químicos y nutrición.',
    54:'Gas noble utilizado en iluminación, propulsión iónica y otras tecnologías.',
    57:'Elemento que da nombre a la serie de los lantánidos; se usa en materiales ópticos y aleaciones.',
    74:'Metal de alto punto de fusión, conocido también como tungsteno.',
    78:'Metal noble utilizado en catalizadores, electrónica y joyería.',
    79:'Metal precioso de alta resistencia a la corrosión, apreciado en electrónica y joyería.',
    80:'Metal líquido a temperatura ambiente, tóxico y sujeto a controles estrictos.',
    82:'Metal denso usado históricamente en baterías y protección radiológica.',
    86:'Gas noble radiactivo que puede acumularse en interiores y representar un riesgo para la salud.',
    92:'Elemento radiactivo utilizado como combustible en reactores nucleares.',
    94:'Elemento radiactivo producido en reactores, con aplicaciones nucleares controladas.',
    118:'Elemento sintético extremadamente inestable. Sus propiedades químicas se investigan experimentalmente.'
  };
  const genericDescriptions = {
    alcalino:'Metal de la primera familia de la tabla periódica, caracterizado por su alta reactividad.',
    alcalinoterreo:'Metal del grupo 2 de la tabla periódica, presente en minerales y compuestos útiles.',
    transicion:'Metal del bloque d asociado con múltiples aplicaciones industriales y tecnológicas.',
    postransicion:'Elemento metálico del bloque p con propiedades y aplicaciones diversas.',
    metaloide:'Elemento con características intermedias entre metales y no metales.',
    nometal:'Elemento no metálico importante en compuestos naturales y procesos químicos.',
    halogeno:'Elemento de la familia de los halógenos, conocida por formar muchos compuestos reactivos.',
    noble:'Elemento del grupo 18, caracterizado por su limitada reactividad química en condiciones habituales.',
    lantanido:'Elemento de la serie de los lantánidos, utilizada en imanes, materiales ópticos y tecnologías avanzadas.',
    actinido:'Elemento de la serie de los actínidos; varios de ellos son radiactivos y tienen aplicaciones científicas.'
  };
  const state = { layout:'table', category:'todos', query:'', selected:1, rx:9, ry:-10, zoom:1, dragging:false, moved:false };
  const tileMap = new Map();
  const elemMap = new Map(elements.map(el => [el.number, el]));
  const normalize = str => String(str).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const isMatch = el => (state.category === 'todos' || el.category === state.category) && (!state.query || normalize(`${el.name} ${el.symbol} ${el.number}`).includes(state.query));

  function createTile(el) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'element-tile';
    tile.style.setProperty('--tile-accent', familyInfo[el.category].color);
    tile.dataset.number = String(el.number);
    tile.setAttribute('aria-label', `${el.name}, símbolo ${el.symbol}, número atómico ${el.number}`);
    tile.setAttribute('aria-pressed', el.number === state.selected ? 'true' : 'false');
    const num = document.createElement('span');num.className = 'tile-number';num.textContent = el.number;
    const sym = document.createElement('span');sym.className = 'tile-symbol';sym.textContent = el.symbol;
    const name = document.createElement('span');name.className = 'tile-name';name.textContent = el.name;
    tile.append(num,sym,name);
    tile.addEventListener('click', () => selectElement(el.number));
    tile.addEventListener('mouseenter', () => { tile.dataset.hover = 'true'; positionTile(el); });
    tile.addEventListener('mouseleave', () => { delete tile.dataset.hover;positionTile(el); });
    tile.addEventListener('focus', () => { tile.dataset.hover = 'true';positionTile(el); });
    tile.addEventListener('blur', () => { delete tile.dataset.hover;positionTile(el); });
    world.appendChild(tile);
    tileMap.set(el.number,tile);
  }

  function pointFor(el) {
    const n = el.number - 1;
    if (state.layout === 'table') {
      return { x:(el.x-9.5)*61, y:(el.y-5.5)*64, z:Math.sin(el.x*.8+el.y)*8, ry:0 };
    }
    if (state.layout === 'sphere') {
      const yy = 1-(n/(elements.length-1))*2;
      const rr = Math.sqrt(1-yy*yy);
      const phi = Math.PI*(3-Math.sqrt(5))*n;
      const x = 315*rr*Math.cos(phi), y = 315*yy, z=315*rr*Math.sin(phi);
      return {x,y,z,ry:Math.atan2(x,z)*180/Math.PI};
    }
    const theta=n*.37;
    return {x:280*Math.sin(theta),y:(n-(elements.length-1)/2)*8,z:280*Math.cos(theta),ry:theta*180/Math.PI};
  }

  function positionTile(el) {
    const tile = tileMap.get(el.number);
    const p = pointFor(el);
    tile.style.transform=`translate3d(${p.x}px,${p.y}px,${p.z + (tile.dataset.hover==='true' ? 42:0)}px) translate(-50%,-50%) rotateY(${p.ry}deg) scale(${tile.dataset.hover==='true'?1.2:1})`;
    tile.style.zIndex=String(Math.round(p.z)+450);
  }

  function baseScale() {
    const width = scene.clientWidth;
    if (state.layout === 'table') return Math.min(1.03,Math.max(.31,(width-14)/1160));
    if (state.layout === 'sphere') return Math.min(1.08,Math.max(.55,(width-12)/755));
    return Math.min(1,Math.max(.5,(width-12)/795, Math.min(.85,(scene.clientHeight-12)/1040)));
  }

  function updateCamera() {
    world.style.transform=`scale(${baseScale()*state.zoom}) rotateX(${state.rx}deg) rotateY(${state.ry}deg)`;
    zoomLabel.textContent=Math.round(state.zoom*100)+'%';
  }

  function updateLayout() {
    elements.forEach(positionTile);
    const labels=world.querySelectorAll('.series-label');
    labels.forEach(label => {label.style.opacity=state.layout==='table'?'1':'0'; });
    document.querySelectorAll('.layout-btn').forEach(btn => {const active=btn.dataset.layout===state.layout;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
    $('sceneHint').textContent= state.layout==='table' ? '✥  ARRASTRA EL ESPACIO LIBRE PARA ROTAR' : '✥  ARRASTRA PARA EXPLORAR LA ESTRUCTURA 3D';
    $('viewDescription').textContent = ({table:'Vista tabla · Períodos 1–7 · Series inferiores: lantánidos y actínidos',sphere:'Vista esfera · Los 118 elementos distribuidos en el espacio',helix:'Vista hélice · Explora los elementos por número atómico'})[state.layout];
    updateCamera();
  }

  function filterTiles() {
    const matches=elements.filter(isMatch);
    const matchSet=new Set(matches.map(e=>e.number));
    for(const el of elements){
      const tile=tileMap.get(el.number);
      tile.classList.toggle('dimmed',!matchSet.has(el.number));
      tile.classList.toggle('match',state.query!==''&&matchSet.has(el.number));
      tile.tabIndex=matchSet.has(el.number)?0:-1;
    }
    countLabel.textContent=`${matches.length} / 118 ELEMENTOS`;
    if (matches.length && !matchSet.has(state.selected)) selectElement(matches[0].number);
  }

  function selectElement(n) {
    const el=elemMap.get(n); if(!el) return;
    const previous=tileMap.get(state.selected);
    if(previous){previous.classList.remove('selected');previous.setAttribute('aria-pressed','false');}
    state.selected=n;
    const chosen=tileMap.get(n);
    chosen.classList.add('selected');chosen.setAttribute('aria-pressed','true');
    const c=familyInfo[el.category];
    $('atomVisual').style.setProperty('--atom-color',c.color);
    $('detailSymbol').style.setProperty('--atom-color',c.color);
    $('detailSymbol').textContent=el.symbol;
    $('atomCenter').textContent=el.symbol;
    $('detailNumber').innerHTML = `Nº ${String(n).padStart(3,'0')} <span>—</span> ELEMENTO`;
    $('detail-title').textContent=el.name;
    $('detailFamily').textContent=c.label;
    $('elementDescription').textContent=descriptions[n]||genericDescriptions[el.category];
    $('propNumber').textContent=n;
    $('propMass').textContent=el.mass.toLocaleString('es-MX',{maximumFractionDigits:4})+' u';
    $('propGroup').textContent=el.group ?? 'Bloque f';
    $('propPeriod').textContent=el.period;
    $('propPhase').textContent=el.phase;
    window.PERIODIC_SELECTED=n;
    window.dispatchEvent(new CustomEvent('periodic:select',{detail:{number:n}}));
  }

  function chooseCategory(category) {
    state.category=category;
    document.querySelectorAll('.cat-btn').forEach(btn=>{const active=btn.dataset.category===category;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
    filterTiles();
  }

  function resetView() {
    state.rx=state.layout==='table'?9:0;
    state.ry=state.layout==='table'?-10:0;
    state.zoom=1;
    updateCamera();
  }

  Object.entries(familyInfo).forEach(([id,info])=>{
    const button=document.createElement('button');
    button.className='cat-btn'+(id==='todos'?' active':'');
    button.type='button';
    button.dataset.category=id;
    button.style.setProperty('--cat-color',info.color);
    button.setAttribute('aria-pressed',String(id==='todos'));
    const dot=document.createElement('span');dot.setAttribute('aria-hidden','true');
    button.append(dot,document.createTextNode(info.label));
    button.addEventListener('click',()=>chooseCategory(id));
    categories.appendChild(button);
  });
  elements.forEach(createTile);

  // Labels are attached to the 3D world and only visible in table mode.
  for(const [label,y] of [['LANTÁNIDOS',9],['ACTÍNIDOS',10]]){
    const span=document.createElement('div');span.className='series-label';span.textContent=label;
    span.style.transform=`translate3d(-577px,${(y-5.5)*64}px,0px) translateY(-50%)`;
    world.appendChild(span);
  }

  document.querySelectorAll('.layout-btn').forEach(button=>button.addEventListener('click',()=>{
    state.layout=button.dataset.layout;
    resetView();
    updateLayout();
  }));
  search.addEventListener('input',()=>{
    state.query=normalize(search.value);
    filterTiles();
  });
  $('zoomIn').addEventListener('click',()=>{state.zoom=Math.min(2.2,Math.round((state.zoom+.15)*100)/100);updateCamera();});
  $('zoomOut').addEventListener('click',()=>{state.zoom=Math.max(.4,Math.round((state.zoom-.15)*100)/100);updateCamera();});
  $('resetView').addEventListener('click',resetView);
  document.addEventListener('keydown',(e)=>{
    if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();search.focus();}
    if(e.key==='Escape' && document.activeElement===search){search.value='';state.query='';filterTiles();search.blur();}
  });

  let down=null;
  scene.addEventListener('pointerdown',(e)=>{
    if(e.button!==0 || e.target.closest('.element-tile'))return;
    down={x:e.clientX,y:e.clientY,rx:state.rx,ry:state.ry};
    scene.classList.add('dragging');
    scene.setPointerCapture(e.pointerId);
  });
  scene.addEventListener('pointermove',(e)=>{
    if(!down)return;
    const dx=e.clientX-down.x,dy=e.clientY-down.y;
    state.ry=down.ry+dx*.26;
    state.rx=Math.max(-78,Math.min(78,down.rx-dy*.20));
    updateCamera();
  });
  function endDrag(){down=null;scene.classList.remove('dragging');}
  scene.addEventListener('pointerup',endDrag);
  scene.addEventListener('pointercancel',endDrag);
  scene.addEventListener('keydown',(e)=>{
    if(e.target!==scene)return;
    if(e.key==='ArrowLeft'){state.ry-=10;updateCamera();e.preventDefault();}
    if(e.key==='ArrowRight'){state.ry+=10;updateCamera();e.preventDefault();}
    if(e.key==='ArrowUp'){state.rx=Math.min(78,state.rx+10);updateCamera();e.preventDefault();}
    if(e.key==='ArrowDown'){state.rx=Math.max(-78,state.rx-10);updateCamera();e.preventDefault();}
  });
  window.PERIODIC_SELECT=selectElement;
  window.addEventListener('resize',updateCamera,{passive:true});
  selectElement(1);
  updateLayout();
  filterTiles();
})();
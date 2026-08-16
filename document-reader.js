import * as pdfjsLib from './assets/pdfjs/pdf.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc='./assets/pdfjs/pdf.worker.mjs';

const DOCS={
  constitution:{title:'Perlembagaan Persekutuan - Cetakan Semula 2020',file:'assets/Perlembagaan-Persekutuan-Cetakan-Semula-2020.pdf',kind:'Perkara'},
  education:{title:'Akta Pendidikan 1996 - Akta 550',file:'assets/Akta-Pendidikan-1996-Akta-550.pdf',kind:'Seksyen'},
  language:{title:'Akta Bahasa Kebangsaan 1963',file:'assets/Akta-Bahasa-Kebangsaan-1963.pdf',kind:'Seksyen'}
};
const params=new URLSearchParams(location.search),docKey=DOCS[params.get('doc')]?params.get('doc'):'constitution',doc=DOCS[docKey];
const status=document.querySelector('#readerStatus'),results=document.querySelector('#readerResults'),detail=document.querySelector('#sourceDetail'),search=document.querySelector('#sourceSearch'),sections=document.querySelector('#sectionList');
document.querySelector('#docTitle').textContent=doc.title;search.value=params.get('query')||'';
let records=[],activeSection='Semua',nextId=1;
const clean=s=>s.replace(/\u0000/g,'').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
const esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const pageText=items=>clean(items.map(i=>`${i.str}${i.hasEOL?'\n':' '}`).join(''));
function terms(){return search.value.trim().toLowerCase().split(/\s+/).filter(Boolean)}
function hi(s){let x=esc(s);terms().forEach(t=>{const e=t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');x=x.replace(new RegExp(`(${e})`,'gi'),'<mark>$1</mark>')});return x}
function legalHighlight(s){return s.replace(/\b(tidak boleh|hendaklah|berhak|boleh|tertakluk kepada|mestilah)\b/gi,'<mark>$1</mark>')}
function sectionFrom(text,fallback){const m=text.match(/(?:^|\n)(Bahagian\s+[IVXLCDM]+(?:\s*[A-Za-z])?(?:\n[^\n]{1,120})?|BAB\s+[IVXLCDM]+[^\n]*)/i);return m?clean(m[1]).replace(/\n/g,' '):fallback}
function titleBefore(text,pos,number){const before=text.slice(Math.max(0,pos-260),pos).split('\n').map(x=>x.trim()).filter(x=>x.length>2&&!/^\[.*\]$/.test(x));const candidate=before.reverse().find(x=>!/^\d+$/.test(x)&&!/^Perlembagaan|^Akta/i.test(x));return `${doc.kind} ${number}${candidate?` - ${candidate}`:''}`}
function addRecord(section,title,text,page){records.push({id:nextId++,section,title,text,pages:[page]})}
function appendToLast(text,page){if(!records.length){addRecord('Permulaan dokumen',`Halaman ${page}`,text,page);return}const last=records[records.length-1];last.text+=`\n\n${text}`;if(last.pages[last.pages.length-1]!==page)last.pages.push(page)}
function parsePage(text,page,section){const re=/(?:^|\n)(\d{1,3}\s*[A-Za-z]?)\.\s*(?=[A-Za-z(])/g;const matches=[...text.matchAll(re)];if(!matches.length){appendToLast(text,page);return}const first=matches[0].index+(matches[0][0].startsWith('\n')?1:0);if(text.slice(0,first).trim())appendToLast(text.slice(0,first).trim(),page);matches.forEach((m,i)=>{const start=m.index+(m[0].startsWith('\n')?1:0),end=i+1<matches.length?matches[i+1].index:text.length;const body=text.slice(start,end).trim();addRecord(section,titleBefore(text,start,m[1].replace(/\s/g,'')),body,page)})}
async function build(pdf){let current='Permulaan dokumen';for(let n=1;n<=pdf.numPages;n++){status.textContent=`Mengekstrak, membahagi dan mengindeks halaman ${n} daripada ${pdf.numPages}...`;const page=await pdf.getPage(n),content=await page.getTextContent(),text=pageText(content.items);if(!text)continue;current=sectionFrom(text,current);parsePage(text,n,current)}status.hidden=true;renderSections();render()}
async function extract(){try{await build(await pdfjsLib.getDocument(doc.file).promise)}catch(e){status.innerHTML='Dokumen tidak dapat dimuatkan secara automatik dalam pelayar ini. <button id="chooseSource" class="next-button">Pilih fail PDF sumber</button>';document.querySelector('#chooseSource').onclick=chooseFile;console.error(e)}}
async function chooseFile(){const input=document.createElement('input');input.type='file';input.accept='application/pdf';input.onchange=async()=>{if(!input.files[0])return;records=[];nextId=1;status.hidden=false;const bytes=new Uint8Array(await input.files[0].arrayBuffer());await build(await pdfjsLib.getDocument({data:bytes}).promise)};input.click()}
function renderSections(){const all=['Semua',...new Set(records.map(r=>r.section))];sections.innerHTML=all.map(s=>`<button class="${s===activeSection?'active':''}" data-section="${esc(s)}">${esc(s)}</button>`).join('');sections.querySelectorAll('button').forEach(b=>b.onclick=()=>{activeSection=b.dataset.section;renderSections();render()})}
function filtered(){const ts=terms();return records.filter(r=>(activeSection==='Semua'||r.section===activeSection)&&ts.every(t=>`${r.title} ${r.text}`.toLowerCase().includes(t)))}
function pageLabel(r){return r.pages.length===1?`Halaman PDF ${r.pages[0]}`:`Halaman PDF ${r.pages[0]}-${r.pages[r.pages.length-1]}`}
function render(){const found=filtered();results.innerHTML=found.slice(0,100).map(r=>`<button class="source-result" data-id="${r.id}"><b>${hi(r.title)}</b><small>${hi(r.section)} · ${pageLabel(r)}</small></button>`).join('')||'<p class="empty-state">Tiada hasil. Cuba kata kunci lain atau pilih Semua.</p>';results.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>show(records.find(r=>r.id===+b.dataset.id)));if(found.length>100)results.insertAdjacentHTML('beforeend',`<p class="empty-state">Menunjukkan 100 hasil pertama daripada ${found.length} hasil.</p>`);if(found.length&&(!detail.dataset.id||!found.some(r=>String(r.id)===detail.dataset.id)))show(found[0])}
function sentences(r){return r.text.replace(/\s+/g,' ').split(/(?<=[.!?])\s+/).filter(s=>s.length>35)}
function keyPoints(r){const picks=sentences(r).filter(s=>/\b(tidak boleh|hendaklah|berhak|boleh|tertakluk kepada|mestilah)\b/i.test(s)).slice(0,3);return picks.length?picks:sentences(r).slice(0,3)}
function note(r){const first=keyPoints(r)[0]||sentences(r)[0];return first||'Baca tajuk, fasal dan istilah utama dalam teks asal ini.'}
function show(r){detail.hidden=false;detail.dataset.id=r.id;const points=keyPoints(r);detail.innerHTML=`<p class="eyebrow">${hi(r.section)} · ${pageLabel(r).toUpperCase()}</p><h2>${hi(r.title)}</h2><h3>NOTA MUDAH</h3><div class="source-note-box">${legalHighlight(hi(note(r)))}</div><h3>POIN PENTING DARIPADA TEKS ASAL</h3><ul>${points.map(x=>`<li>${legalHighlight(hi(x))}</li>`).join('')}</ul><h3>TEKS ASAL LENGKAP</h3><div class="source-original">${legalHighlight(hi(r.text))}</div>`;detail.scrollIntoView({behavior:'smooth',block:'start'})}
search.addEventListener('input',render);extract();

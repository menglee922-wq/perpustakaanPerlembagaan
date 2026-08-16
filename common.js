const $=(s,p=document)=>p.querySelector(s),$$=(s,p=document)=>[...p.querySelectorAll(s)];
let favourites=JSON.parse(localStorage.getItem('pll-favourites')||'[]');
function saveFavourites(){localStorage.setItem('pll-favourites',JSON.stringify(favourites));$$('[data-fav-count]').forEach(x=>x.textContent=favourites.length)}
function toggleFavourite(id){favourites=favourites.includes(id)?favourites.filter(x=>x!==id):[...favourites,id];saveFavourites()}
function card(t){return `<article class="article-card"><span class="meta">${t.bahagian} · ${t.article}</span><h3>${t.title}</h3><p>${t.easy}</p><div class="tag-list">${t.keywords.slice(0,3).map(k=>`<span class="tag">${k}</span>`).join('')}</div><div class="card-actions"><a class="open-topic" href="article.html?id=${t.id}">Buka topik →</a><button class="fav-button" data-fav="${t.id}" aria-label="Simpan topik">${favourites.includes(t.id)?'★':'☆'}</button></div></article>`}
function bindFavourites(scope=document){$$('[data-fav]',scope).forEach(b=>b.onclick=()=>{toggleFavourite(b.dataset.fav);b.textContent=favourites.includes(b.dataset.fav)?'★':'☆'})}
function setupMenu(){const b=$('#menuButton'),n=$('#mainNav');if(b&&n)b.onclick=()=>{n.classList.toggle('open');b.setAttribute('aria-expanded',n.classList.contains('open'))}}
setupMenu();saveFavourites();bindFavourites();

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const normalize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase('ja').replace(/\s+/g,' ').trim();
// Match normalized search terms while rendering the original characters and spacing.
export function highlightMatches(value, query='') {
  const original=String(value ?? '');
  const terms=[...new Set(normalize(query).split(' ').filter(Boolean))];
  if(!terms.length)return escapeHTML(original);
  let searchable='';
  const offsets=[];
  for(const {segment,index} of new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(original)) {
    const normalized=segment.normalize('NFKC').toLocaleLowerCase('ja');
    for(const character of normalized) {
      const part=/\s/u.test(character)?' ':character;
      if(part===' ' && searchable.endsWith(' ')) {
        offsets[offsets.length-1][1]=index+segment.length;
        continue;
      }
      searchable+=part;
      for(let unit=0;unit<part.length;unit++)offsets.push([index,index+segment.length]);
    }
  }
  const ranges=[];
  for(const term of terms) {
    let from=0, found;
    while((found=searchable.indexOf(term,from))!==-1) {
      ranges.push([offsets[found][0],offsets[found+term.length-1][1]]);
      from=found+1;
    }
  }
  ranges.sort((a,b)=>a[0]-b[0] || a[1]-b[1]);
  const merged=[];
  for(const range of ranges) {
    const last=merged[merged.length-1];
    if(last && range[0]<=last[1])last[1]=Math.max(last[1],range[1]);
    else merged.push([...range]);
  }
  let html='', cursor=0;
  for(const [start,end] of merged) {
    html+=escapeHTML(original.slice(cursor,start))+`<mark class="search-match">${escapeHTML(original.slice(start,end))}</mark>`;
    cursor=end;
  }
  return html+escapeHTML(original.slice(cursor));
}
export function findEntryMatch(data, query) {
  const key=value=>normalize(value).replace(/[\u30a1-\u30f6]/g, c=>String.fromCharCode(c.charCodeAt(0)-0x60));
  const input=key(query);
  if(!input)return null;
  return data.editorial.words.find(w=>key(w.title)===input || key(w.reading)===input) || null;
}
export function filterResponses(data, {wordId='', category='', query='', personId=''}={}) {
  const word = data.editorial.words.find(w=>w.id===wordId);
  const members = word?.categories.find(c=>c.id===category)?.responseIds;
  const terms=normalize(query).split(' ').filter(Boolean);
  return data.responses.filter(r=>{
    if (wordId && r.wordId!==wordId || personId && r.respondentId!==personId || category && members && !members.includes(r.id)) return false;
    const p=data.respondents.find(p=>p.id===r.respondentId);
    const w=data.editorial.words.find(w=>w.id===r.wordId);
    return terms.every(t=>normalize(`${p?.name} ${r.text} ${w?.title} ${w?.reading}`).includes(t));
  });
}
export function categoryCounts(data, word) {
  const ids=new Set(data.responses.filter(r=>r.wordId===word.id).map(r=>r.id));
  return word.categories.map(c=>({...c,count:(c.responseIds || []).filter(id=>ids.has(id)).length})).sort((a,b)=>b.count-a.count);
}
export function parseRoute(hash) {
  const [path,query='']=(hash.replace(/^#/, '') || '/').split('?');
  return {path,params:new URLSearchParams(query)};
}
export function inspectData(data) {
  if (!data || !Array.isArray(data.respondents) || !Array.isArray(data.responses) || !Array.isArray(data.editorial?.words)) throw new Error('辞典データの形式を確認してください。');
  const warnings=[];
  for (const word of data.editorial.words) {
    if (!Array.isArray(word.categories)) {word.categories=[]; warnings.push(`${word.title}の分類情報がありません。回答原文は表示できます。`);}
    const expected=data.responses.filter(r=>r.wordId===word.id).map(r=>r.id);
    const assigned=word.categories.flatMap(c=>c.responseIds || []);
    if (expected.some(id=>assigned.filter(a=>a===id).length!==1) || assigned.some(id=>!expected.includes(id))) warnings.push(`${word.title}の分類情報に不足または重複があります。集計は参考表示です。`);
  }
  return warnings;
}

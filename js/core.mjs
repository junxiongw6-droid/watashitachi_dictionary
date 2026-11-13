export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const normalize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase('ja').replace(/\s+/g,' ').trim();
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

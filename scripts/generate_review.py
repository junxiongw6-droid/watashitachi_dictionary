"""Printable editorial review material. Blank fields never imply classmates approved it."""
import json
from html import escape
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def render_review(data):
    people={p['id']:p['name'] for p in data['respondents']}
    sections=[]
    for word in data['editorial']['words']:
        rows=[]
        for response in data['responses']:
            if response['wordId']!=word['id']:continue
            category=next(c for c in word['categories'] if response['id'] in c['responseIds'])
            note=data['editorial'].get('notes',{}).get(response['id'],'')
            note_html=f'<p class="note">編者注：{escape(note)}</p>' if note else ''
            rows.append(f'''<tr data-record="{escape(response['id'])}"><td data-label="回答者"><span class="raw">{escape(people[response['respondentId']])}</span><small>{escape(response['id'])}</small></td><td data-label="回答原文" class="raw original">{escape(response['text'])}</td><td data-label="編者による主分類">{escape(category['title'])}{note_html}</td><td data-label="本人の確認" class="confirmation">□ 確認した<br>□ 修正を希望する<br><br>意見：<br>＿＿＿＿＿＿＿</td></tr>''')
        sections.append(f'''<section><h2>{escape(word['title'])} <small>{escape(word['reading'])}</small></h2><h3>回答をもとに編者がまとめた定義</h3><blockquote>{escape(word['definition'])}</blockquote><p class="writing-line">定義への意見：________________________________________________________________</p><table><thead><tr><th>回答者・記録</th><th>回答原文</th><th>編者による主分類</th><th>本人の確認</th></tr></thead><tbody>{''.join(rows)}</tbody></table><h3>編者によるまとめ</h3><p>{escape(word['summary'])}</p><p class="writing-line">クラスで話し合ったこと：________________________________________________________</p></section>''')
    return '''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>クラスで確かめる — 私たちの言葉辞典</title><style>
*{box-sizing:border-box}body{margin:0 auto;max-width:1100px;padding:30px;color:#303c35;background:#f7f5ef;font-family:'Noto Sans JP','Yu Gothic',sans-serif;font-size:16px;line-height:1.9}h1,h2,blockquote{font-family:'Noto Serif JP','Yu Mincho',serif;font-weight:400}h1{font-size:30px}h2{font-size:28px;border-bottom:1px solid #aaa;padding-bottom:12px}h3{font-size:16px;margin-top:25px}a{color:inherit}button{font:inherit;padding:10px 20px;min-height:48px;background:#303c35;color:white;border:0;cursor:pointer}.toolbar{display:flex;gap:25px;align-items:center;flex-wrap:wrap}.intro{background:#e9eee3;padding:20px;margin:25px 0}.intro p{margin:8px 0}section{margin-top:45px}blockquote{font-size:20px;margin:18px 0;padding:15px 20px;border-left:2px solid #607a6b;line-height:2}.writing-line{margin:25px 0;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;font-size:14px;table-layout:fixed}th,td{padding:12px;border:1px solid #bfc6b8;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#e9eee3}th:nth-child(1){width:14%}th:nth-child(2){width:42%}th:nth-child(3){width:24%}th:nth-child(4){width:20%}.raw{white-space:pre-wrap;overflow-wrap:anywhere}.original{font-size:15px;line-height:2}small{display:block;font-size:12px;color:#59665b;margin-top:6px}.note{font-size:13px;border-top:1px solid #bfc6b8;padding-top:10px;line-height:1.9}.confirmation{font-size:13px;line-height:2.2}footer{margin-top:40px;font-size:13px;border-top:1px solid #bbb;padding-top:15px}
@media screen and (max-width:700px){body{padding:20px}h1{font-size:25px}table,tbody,tr,td{display:block;width:100%}thead{display:none}tr{border:1px solid #bfc6b8;margin:18px 0}td{border:0;border-bottom:1px solid #ddd}td:last-child{border-bottom:0}td:before{content:attr(data-label);display:block;font-size:12px;font-weight:bold;color:#607a6b;margin-bottom:7px}.confirmation{font-size:14px}}
@media print{@page{size:A4;margin:14mm}body{max-width:none;padding:0;background:white;font-size:10pt}.toolbar{display:none}h1{font-size:19pt}h2{font-size:18pt}h3{font-size:11pt}.intro{padding:10px;background:none;border:1px solid #bbb}section{break-before:page;margin-top:0}table{font-size:9pt}th,td{padding:7px}thead{display:table-header-group}tr{break-inside:avoid}.original{font-size:10pt;line-height:1.8}.note,small,.confirmation{font-size:8.5pt}blockquote{font-size:13pt}.writing-line{margin:18px 0}footer{font-size:9pt}}
</style></head><body><div class="toolbar"><a href="../#/about">← 辞典に戻る</a><button onclick="window.print()">印刷・PDFとして保存</button></div><h1>クラスで確かめる<br>私たちの言葉辞典</h1><div class="intro"><p><strong>確認状況：未確認。本人・クラスによる確認は、これから行います。</strong></p><p>原文、編者による主分類、定義を並べた確認用シートです。確認欄は未記入です。実際に確認した項目だけ記入してください。</p><ol><li>自分の原文と名前が正しく載っているか。</li><li>主分類や編者注が、自分の伝えたい意味に合っているか。違う場合は理由と希望する分類を書く。</li><li>定義とまとめをクラスで読み、共通点や少数の見方が適切に扱われているか話し合う。</li></ol><p>表記や文法を直すためのシートではありません。原文を残したまま、編集上の解釈を確認します。</p></div>'''+''.join(sections)+f'''<footer>{len(data['respondents'])}人・{len(data['responses'])}回答。確認欄への入力内容をウェブ上で送信・保存する機能はありません。印刷して記入するか、PDFとして保存してお使いください。</footer></body></html>'''

if __name__=='__main__':
    data=json.loads((ROOT/'data/dictionary.json').read_text())
    folder=ROOT/'review';folder.mkdir(exist_ok=True)
    (folder/'index.html').write_text(render_review(data))
    print('Created printable review/index.html with all original answers; review status is pending.')

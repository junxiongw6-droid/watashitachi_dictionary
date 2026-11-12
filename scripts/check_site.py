"""Verify an actually deployed repository subpath against the approved source dataset."""
import argparse
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlparse

parser=argparse.ArgumentParser()
parser.add_argument('url')
args=parser.parse_args()
base=args.url.rstrip('/')+'/'
if urlparse(base).scheme!='https':parser.error('Published HTTPS URL required')
root=Path(__file__).resolve().parents[1]
expected=json.loads((root/'data/dictionary.json').read_text())
for path in ['','css/style.css','css/fonts.css','js/app.js','js/core.mjs','data/dictionary.json']:
    with urlopen(Request(urljoin(base,path),headers={'Cache-Control':'no-cache'}),timeout=30) as result:
        if result.status!=200:raise ValueError(f'{path}: HTTP {result.status}')
        content=result.read().decode('utf-8')
        if path=='':assert '私たちの言葉辞典' in content
        if path=='data/dictionary.json':
            actual=json.loads(content)
            assert actual==expected,'Live data differs from the approved source dataset'
print(json.dumps({'url':base,'status':'passed','mode':actual['mode'],'respondents':len(actual['respondents']),'responses':len(actual['responses'])},ensure_ascii=False))

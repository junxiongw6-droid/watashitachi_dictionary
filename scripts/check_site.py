"""Verify the exact deployed release, including assets, data and requested content removal."""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlparse
import time
import re

parser=argparse.ArgumentParser()
parser.add_argument('url')
args=parser.parse_args()
base=args.url.rstrip('/')+'/'
if urlparse(base).scheme!='https':parser.error('Published HTTPS URL required')
root=Path(__file__).resolve().parents[1]
dist=root/'dist'
if not (dist/'index.html').is_file():parser.error('Run scripts/build.py before checking the deployed release')
expected_html=(dist/'index.html').read_text()
release=hashlib.sha256(expected_html.encode()).hexdigest()[:16]
paths=['?release='+release]+re.findall(r'(?:src|href)="\./([^"#]+)"',expected_html)
app=(dist/'js/app.js').read_text()
paths+=['js/'+p for p in re.findall(r"from '\./([^']+)'",app)]
paths+=re.findall(r'href="\./(review/[^"]+)"',app)
paths+=['data/'+p for p in re.findall(r"new URL\('\.\./data/([^']+)'",app)]
# Retry briefly for CDN propagation; compare actual bytes rather than only HTTP 200.
for attempt in range(6):
    try:
        for path in paths:
            local=dist/('index.html' if path.startswith('?') else path.split('?')[0])
            with urlopen(Request(urljoin(base,path),headers={'Cache-Control':'no-cache'}),timeout=30) as result:
                assert result.status==200,f'{path}: HTTP {result.status}'
                body=result.read()
                assert body==local.read_bytes(),f'{path}: live content is stale or differs from this release'
        assert 'プライバシーについて' not in app,'Removed privacy block reappeared in published code'
        break
    except Exception:
        if attempt==5:raise
        time.sleep(5)
data=json.loads((dist/'data/dictionary.json').read_text())
print(json.dumps({'url':base,'release':release,'status':'passed','exactAssetComparison':True,'privacyBlockRemoved':True,'mode':data['mode'],'respondents':len(data['respondents']),'responses':len(data['responses'])},ensure_ascii=False))

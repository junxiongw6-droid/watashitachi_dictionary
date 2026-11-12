"""Explicit allowlist deployment: never copy Excel, private/, or source .git."""
import argparse
import json
import shutil
from pathlib import Path
from convert_excel import ROOT, read_workbook, find_source
from validate_data import validate


def assemble(raw, editorial, mode='anonymous'):
    people = raw['respondents']
    if mode=='anonymous':
        people=[{**{k:v for k,v in p.items() if k!='name'}, 'name':p['label']} for p in people]
    result={'schemaVersion':1,'mode':mode,'sourceSHA256':raw['sourceSHA256'],'respondents':people,'responses':raw['responses'],'editorial':editorial}
    validate(raw,editorial,result)
    return result


def main():
    parser=argparse.ArgumentParser()
    settings=json.loads((ROOT/'data/publication.json').read_text())
    parser.add_argument('--mode',choices=['anonymous','full'],default=settings.get('mode','anonymous'))
    parser.add_argument('--consent-confirmed',action='store_true',help='Use only after classmates consent and owner confirms publication')
    args=parser.parse_args()
    if args.mode=='full' and not (args.consent_confirmed or settings.get('publicationApproved') is True):
        parser.error('Full mode requires --consent-confirmed; obtain permission first')
    raw=read_workbook(find_source())
    editorial=json.loads((ROOT/'data/editorial.json').read_text())
    data=assemble(raw,editorial,args.mode)
    data['nameKind']=settings.get('nameKind','unspecified') if args.mode=='full' else 'anonymous'
    # Track the exact approved publication dataset so development and production agree.
    (ROOT/'data/dictionary.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    dist=ROOT/'dist'
    if dist.exists():shutil.rmtree(dist)
    dist.mkdir()
    for folder in ['css','js','assets']:
        shutil.copytree(ROOT/folder,dist/folder)
    shutil.copy(ROOT/'index.html',dist/'index.html')
    (dist/'.nojekyll').touch()
    (dist/'data').mkdir()
    (dist/'data/dictionary.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    if args.mode=='anonymous':
        # Check the entire public output, not only the visible name field.
        for file in dist.rglob('*'):
            if file.is_file() and file.suffix != '.woff2':
                content=file.read_text(encoding='utf-8')
                for person in raw['respondents']:
                    if person['name'].strip() and person['name'].strip() in content:
                        raise ValueError(f'Name appears in public output: {file.relative_to(dist)}. Review the original response before publication; do not silently change it.')
    report=validate(raw,editorial,data)
    (ROOT/'work').mkdir(exist_ok=True)
    (ROOT/'work/data-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({**report,'mode':args.mode,'output':'dist/'},ensure_ascii=False,indent=2))

if __name__=='__main__':main()

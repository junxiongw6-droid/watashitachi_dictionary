"""Validate every response against Excel, including whitespace and source coordinates."""
import argparse
import json
from collections import Counter
from pathlib import Path
from convert_excel import ROOT, read_workbook, find_source


def validate(raw, editorial, public=None):
    errors = []
    def require(ok, message):
        if not ok: errors.append(message)
    require(editorial.get('sourceSHA256') == raw['sourceSHA256'], 'Workbook changed: review editorial content and update editorial.sourceSHA256 only after review')
    ids = {r['id']: r for r in raw['responses']}
    require(len(ids) == len(raw['responses']), 'Duplicate response ID')
    require(len({p['id'] for p in raw['respondents']}) == len(raw['respondents']), 'Duplicate respondent ID')
    require({w['id'] for w in editorial['words']} == {'kazoku','ai','jiyuu'}, 'Three word entries required')
    for word in editorial['words']:
        assigned = []
        require(50 <= len(word['definition']) <= 100, f"{word['id']}: definition length")
        require(100 <= len(word['summary']) <= 150, f"{word['id']}: summary length")
        require(len({c['id'] for c in word['categories']}) == len(word['categories']), 'Duplicate category ID')
        for c in word['categories']:
            assigned += c['responseIds']
            require(1 <= len(c['representativeIds']) <= 3, f"{c['id']}: representative count")
            require(set(c['representativeIds']) <= set(c['responseIds']), f"{c['id']}: invalid representative")
        expected = [r['id'] for r in raw['responses'] if r['wordId'] == word['id']]
        require(Counter(assigned) == Counter(expected), f"{word['id']}: missing/duplicated classification; review editorial.json after Excel changes")
        for a in [word['common'], *word['discoveries']]:
            require(bool(a['evidenceIds']) and set(a['evidenceIds']) <= set(expected), f"{word['id']}: invalid evidence")
    require(set(editorial.get('tags', {})) <= set(ids), 'Invalid tag reference')
    require(set(editorial.get('notes', {})) <= set(ids), 'Invalid note reference')
    if public is not None:
        require(len(public['responses']) == len(raw['responses']), 'Response count mismatch')
        require(len(public['respondents']) == len(raw['respondents']), 'Respondent count mismatch')
        actual = {r['id']: r for r in public['responses']}
        require(len(actual) == len(public['responses']), 'Duplicate output ID')
        for key, r in ids.items():
            require(actual.get(key) == r, f'{key}: text/person/source modified or missing')
        expected_people = [{**{k:v for k,v in p.items() if k != 'name'}, 'name':p['label']} if public['mode']=='anonymous' else p for p in raw['respondents']]
        require(public['respondents'] == expected_people, 'Respondent mapping changed')
    if errors: raise ValueError('\n'.join(errors))
    return {'respondents':len(raw['respondents']), 'responses':len(ids), 'perWord':dict(Counter(r['wordId'] for r in raw['responses'])), 'warnings':raw['warnings'], 'status':'passed'}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--data', type=Path, default=ROOT/'data/dictionary.json')
    args=parser.parse_args()
    report=validate(read_workbook(find_source()), json.loads((ROOT/'data/editorial.json').read_text()), json.loads(args.data.read_text()))
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__=='__main__':main()

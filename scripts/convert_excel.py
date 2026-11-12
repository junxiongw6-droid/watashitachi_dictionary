"""Lossless workbook ingestion. Identifiable intermediate data stays in private/."""
import argparse
import hashlib
import json
from pathlib import Path
from collections import Counter
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
WORDS = [('kazoku', '家族'), ('ai', '愛'), ('jiyuu', '自由')]

def read_workbook(path):
    book = load_workbook(path, data_only=False)
    people, responses, records, warnings = [], [], [], []
    names, signatures = Counter(), Counter()
    for sheet in book:
        headers = [str(c.value or '') for c in sheet[1][:5]]
        if len(headers) < 5 or not all(word in headers[i+2] for i, (_, word) in enumerate(WORDS)):
            warnings.append(f'Sheet {sheet.title}: unsupported header; not silently imported')
            continue
        for row in sheet.iter_rows(min_row=2):
            values = [c.value for c in row[:5]]
            if not any(v is not None and str(v).strip() for v in values):
                continue
            if any(c.data_type == 'f' for c in row[:5]):
                raise ValueError(f'Formula in {sheet.title}:{row[0].row}; export values first')
            number = len(people)+1
            rid = f'p{number:02d}'
            name = '' if values[1] is None else str(values[1])
            if not name.strip():
                warnings.append(f'{rid}: name missing (record retained)')
            names[name.strip()] += 1
            signature = tuple(str(v) if v is not None else None for v in values[1:])
            signatures[signature] += 1
            source = {'sheet': sheet.title, 'row': row[0].row}
            people.append({'id': rid, 'name': name, 'label': f'回答者{number:02d}', 'source': source})
            records.append({'id': rid, 'source': source, 'values': [v.isoformat() if hasattr(v, 'isoformat') else v for v in values]})
            for col, (key, _) in enumerate(WORDS, 2):
                value = values[col]
                if value is None or not str(value).strip():
                    warnings.append(f'{rid}/{key}: blank response (not fabricated)')
                    continue
                responses.append({'id': f'{rid}-{key}', 'respondentId': rid, 'wordId': key, 'text': str(value), 'source': {**source, 'column': col+1}})
    warnings += [f'Duplicate name: {n!r} ({c} rows); retained as separate submissions pending review' for n, c in names.items() if c > 1]
    warnings += [f'Duplicate submission: {c} identical name/answer rows; retained' for c in signatures.values() if c > 1]
    if not people:
        raise ValueError('No valid worksheet/records found')
    return {'sourceFile': path.name, 'sourceSHA256': hashlib.sha256(path.read_bytes()).hexdigest(), 'respondents': people, 'responses': responses, 'records': records, 'warnings': warnings}

def find_source():
    options = list(ROOT.glob('responses.xlsx*'))
    if len(options) != 1:
        raise ValueError('Pass the workbook path explicitly (expected exactly one responses.xlsx*)')
    return options[0]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', nargs='?', type=Path)
    args = parser.parse_args()
    raw = read_workbook(args.source or find_source())
    target = ROOT/'private/raw.json'
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(raw, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'respondents': len(raw['respondents']), 'responses': len(raw['responses']), 'perWord': dict(Counter(r['wordId'] for r in raw['responses'])), 'warnings': raw['warnings']}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()

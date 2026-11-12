import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path
from openpyxl import Workbook
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
from convert_excel import ROOT, read_workbook, find_source
from build import assemble
from validate_data import validate

class DataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw=read_workbook(find_source())
        cls.editorial=json.loads((ROOT/'data/editorial.json').read_text())

    def workbook(self, rows):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup)
        path=Path(temp.name)/'test.xlsx'
        w=Workbook();w.active.append(['タイムスタンプ','名前','家族','愛','自由'])
        for row in rows:w.active.append(row)
        w.save(path);return path

    def test_counts_and_exact_roundtrip(self):
        public=assemble(self.raw,self.editorial)
        self.assertEqual(validate(self.raw,self.editorial,public)['responses'],54)
        self.assertEqual(public['responses'],self.raw['responses'])
        self.assertEqual(len(public['respondents']),18)

    def test_anonymous_names_consistent_and_removed(self):
        public=assemble(self.raw,self.editorial)
        names={p['id']:p['name'] for p in public['respondents']}
        for r in public['responses']:self.assertRegex(names[r['respondentId']],r'^回答者\d{2}$')
        serialized=json.dumps(public,ensure_ascii=False)
        for p in self.raw['respondents']:self.assertNotIn(p['name'].strip(),serialized)

    def test_full_mode_restores_names_exactly(self):
        public=assemble(self.raw,self.editorial,'full')
        self.assertEqual(public['respondents'],self.raw['respondents'])
        self.assertTrue(public['respondents'][5]['name'].endswith(' '))

    def test_whitespace_and_spelling_preserved(self):
        r=read_workbook(self.workbook([[None,'  テスト ','  原文\u3000\nそのまま ',None,'わからない']]))
        self.assertEqual(r['respondents'][0]['name'],'  テスト ')
        self.assertEqual(r['responses'][0]['text'],'  原文\u3000\nそのまま ')
        self.assertEqual(len(r['responses']),2)
        self.assertTrue(r['warnings'])

    def test_duplicates_retained_and_reported(self):
        r=read_workbook(self.workbook([[None,'テスト','家','愛','自由']]*2))
        self.assertEqual(len(r['respondents']),2)
        self.assertEqual(len(r['responses']),6)
        self.assertEqual(len(r['warnings']),2)

    def test_empty_rows_skipped_but_unnamed_responses_retained(self):
        r=read_workbook(self.workbook([[None,None,None,None,None],[None,None,'回答',None,None]]))
        self.assertEqual(len(r['respondents']),1)
        self.assertEqual(len(r['responses']),1)
        self.assertTrue(any('name missing' in warning for warning in r['warnings']))

    def test_formula_rejected_instead_of_silently_evaluated(self):
        with self.assertRaisesRegex(ValueError,'Formula'):read_workbook(self.workbook([[None,'テスト','=1+1','愛','自由']]))

    def test_changed_original_rejected(self):
        public=assemble(self.raw,self.editorial)
        public['responses']=copy.deepcopy(public['responses'])
        public['responses'][0]['text']+='。'
        with self.assertRaisesRegex(ValueError,'modified'):validate(self.raw,self.editorial,public)

    def test_wrong_person_and_missing_response_rejected(self):
        public=copy.deepcopy(assemble(self.raw,self.editorial))
        public['responses'][0]['respondentId']='p02'
        with self.assertRaisesRegex(ValueError,'modified'):validate(self.raw,self.editorial,public)
        public=copy.deepcopy(assemble(self.raw,self.editorial));public['responses'].pop()
        with self.assertRaisesRegex(ValueError,'missing|mismatch'):validate(self.raw,self.editorial,public)

    def test_double_count_or_missing_classification_rejected(self):
        for operation in ['duplicate','missing']:
            ed=copy.deepcopy(self.editorial)
            ids=ed['words'][0]['categories'][0]['responseIds']
            ids.append(ids[0]) if operation=='duplicate' else ids.pop()
            with self.assertRaisesRegex(ValueError,'classification'):validate(self.raw,ed)

    def test_invented_representative_or_evidence_rejected(self):
        ed=copy.deepcopy(self.editorial)
        ed['words'][0]['common']['evidenceIds']=['invented']
        with self.assertRaisesRegex(ValueError,'evidence'):validate(self.raw,ed)
        ed=copy.deepcopy(self.editorial);ed['words'][0]['categories'][0]['representativeIds']=['p01-ai']
        with self.assertRaisesRegex(ValueError,'representative'):validate(self.raw,ed)

if __name__=='__main__':unittest.main()

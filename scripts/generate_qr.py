"""Generate QR only once the published URL is known and reachable."""
import argparse
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlopen
import qrcode
import qrcode.image.svg

parser=argparse.ArgumentParser()
parser.add_argument('url',help='Verified, actually deployed HTTPS URL')
parser.add_argument('--output',type=Path,default=Path('work/qr'))
args=parser.parse_args()
parsed=urlparse(args.url)
if parsed.scheme!='https' or not parsed.hostname or parsed.hostname in {'localhost','example.com','example.test'}:
    parser.error('Supply a real published HTTPS URL')
with urlopen(args.url,timeout=20) as response:
    if response.status!=200:parser.error('URL is not available')
args.output.mkdir(parents=True,exist_ok=True)
qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=12,border=4)
qr.add_data(args.url);qr.make(fit=True)
qr.make_image(fill_color='black',back_color='white').save(args.output/'dictionary-qr.png')
qr.make_image(image_factory=qrcode.image.svg.SvgPathImage).save(args.output/'dictionary-qr.svg')
(args.output/'url.txt').write_text(args.url+'\n')
print(f'Created PNG + SVG at {args.output}')

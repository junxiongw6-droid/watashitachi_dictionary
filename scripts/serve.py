"""Local preview serves the public allowlist output only."""
import argparse
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--host',default='127.0.0.1')
parser.add_argument('--port',type=int,default=3000)
parser.add_argument('--strictPort',action='store_true')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]/'dist'
if not (root/'index.html').exists():parser.error('Run python scripts/build.py first')
print(f'Local: http://{args.host}:{args.port}',flush=True)
ThreadingHTTPServer((args.host,args.port),partial(SimpleHTTPRequestHandler,directory=str(root))).serve_forever()

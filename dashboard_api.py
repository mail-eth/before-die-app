#!/usr/bin/env python3
"""Trading Dashboard - Lightweight Real-time Dashboard"""
import os, json, time, hmac, hashlib, requests
from http.server import HTTPServer, BaseHTTPRequestHandler

# Load env vars
for env_file in ['/root/.openclaw/workspace/binance.env']:
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if '=' in line:
                    k, v = line.strip().split('=', 1)
                    os.environ[k] = v

API_KEY = os.environ.get('BINANCE_API_KEY', '')
API_SECRET = os.environ.get('BINANCE_API_SECRET', '')
PORT = 8443

def get_sig(params):
    return hmac.new(API_SECRET.encode(), params.encode(), hashlib.sha256).hexdigest()

def get_data():
    now = time.time()
    ts = int(now * 1000)
    params = f'timestamp={ts}&recvWindow=5000'
    sig = get_sig(params)
    url = f'https://fapi.binance.com/fapi/v2/account?{params}&signature={sig}'
    headers = {'X-MBX-APIKEY': API_KEY}
    
    try:
        r = requests.get(url, headers=headers, timeout=5)
        d = r.json()
        balance = float(d.get('availableBalance', 0))
        unreal = float(d.get('totalUnrealizedProfit', 0))
        
        positions = []
        for p in d.get('positions', []):
            if float(p.get('notional', 0)) != 0:
                positions.append({
                    'symbol': p['symbol'],
                    'side': 'LONG' if float(p['positionAmt']) > 0 else 'SHORT',
                    'qty': abs(float(p['positionAmt'])),
                    'entry': float(p['entryPrice']),
                    'unreal': float(p.get('unrealizedProfit', 0))
                })
        
        # 7-day income history
        start = int((now - 7*24*60*60) * 1000)
        params2 = f'timestamp={ts}&startTime={start}&limit=100'
        sig2 = get_sig(params2)
        url2 = f'https://fapi.binance.com/fapi/v1/income?{params2}&signature={sig2}'
        r2 = requests.get(url2, headers=headers, timeout=5)
        trades = [t for t in r2.json() if t.get('incomeType') == 'REALIZED_PNL']
        wins = len([t for t in trades if float(t.get('income', 0)) > 0])
        losses = len([t for t in trades if float(t.get('income', 0)) < 0])
        closed_pnl = sum(float(t.get('income', 0)) for t in trades)
        winrate = (wins / len(trades) * 100) if trades else 0
        
        return {
            'balance': balance,
            'unreal': unreal,
            'positions': positions,
            'winrate': round(winrate, 1),
            'trades': len(trades),
            'wins': wins,
            'losses': losses,
            'closed_pnl': round(closed_pnl, 2)
        }
    except:
        return {'error': True}

HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Trading Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0f0f23;--surface:rgba(255,255,255,.05);--border:rgba(255,255,255,.08);
  --cyan:#00d4ff;--green:#00ff88;--red:#ff4757;--text:#f0f4f8;--dim:#888;
}
body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;padding:20px}
h1{text-align:center;color:var(--cyan);font-size:1.5rem;margin-bottom:24px;letter-spacing:2px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;max-width:900px;margin:0 auto}
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px;text-align:center;transition:transform .2s}
.card:hover{transform:translateY(-2px)}
.card h3{color:var(--dim);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px}
.v{font-size:1.6rem;font-weight:700}
.g{color:var(--green)}.r{color:var(--red)}.c{color:var(--cyan)}
.pos-wrap{max-width:900px;margin:20px auto;background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.pos-header{display:grid;grid-template-columns:2fr 2fr 2fr 2fr 1fr;gap:8px;padding:12px 16px;background:rgba(0,0,0,.2);font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--dim)}
.pos-row{display:grid;grid-template-columns:2fr 2fr 2fr 2fr 1fr;gap:8px;padding:14px 16px;border-bottom:1px solid var(--border);font-size:13px;align-items:center}
.pos-row:last-child{border:none}
.pos-row span:nth-child(2){color:var(--green)}
.btns{display:flex;justify-content:center;gap:10px;margin:20px 0}
button{background:var(--cyan);border:none;padding:10px 28px;border-radius:8px;cursor:pointer;color:#000;font-weight:600;font-size:13px;transition:opacity .2s}
button:hover{opacity:.85}
.foot{text-align:center;font-size:10px;color:var(--dim);margin-top:20px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.dot{animation:pulse 2s infinite}
</style>
</head>
<body>
<h1>📊 TRADING DASHBOARD</h1>

<div class="grid" id="cards">
  <div class="card"><h3>Balance</h3><div class="v g" id="bal">--</div></div>
  <div class="card"><h3>Unrealized</h3><div class="v" id="unreal">--</div></div>
  <div class="card"><h3>Win Rate</h3><div class="v" id="wr">--</div></div>
  <div class="card"><h3>Closed P&L</h3><div class="v" id="pnl">--</div></div>
  <div class="card"><h3>Trades</h3><div class="v c" id="trades">--</div></div>
  <div class="card"><h3>W / L</h3><div class="v"><span class="g" id="wins">--</span> / <span class="r" id="losses">--</span></div></div>
</div>

<div class="pos-wrap">
  <div class="pos-header">
    <span>Symbol</span><span>Side / Qty</span><span>Entry</span><span>Unrealized</span><span>Action</span>
  </div>
  <div id="positions"><div class="pos-row"><span>No open positions</span></div></div>
</div>

<div class="btns">
  <button onclick="load()">Refresh</button>
</div>

<div class="foot"><span class="dot">●</span> Auto-refresh 60s · <span id="last">--</span></div>

<script>
function render(d){
  document.getElementById('bal').textContent='$'+d.balance.toFixed(2);
  var u=document.getElementById('unreal');
  u.textContent=(d.unreal>=0?'+$':'$')+d.unreal.toFixed(2);
  u.className='v '+(d.unreal>=0?'g':'r');
  var w=document.getElementById('wr');
  w.textContent=d.winrate+'%';
  w.className='v '+(d.winrate>=50?'g':'r');
  var p=document.getElementById('pnl');
  p.textContent=(d.closed_pnl>=0?'+$':'$')+d.closed_pnl.toFixed(2);
  p.className='v '+(d.closed_pnl>=0?'g':'r');
  document.getElementById('trades').textContent=d.trades;
  document.getElementById('wins').textContent=d.wins;
  document.getElementById('losses').textContent=d.losses;
  
  var pos=document.getElementById('positions');
  if(d.positions.length===0){
    pos.innerHTML='<div class="pos-row"><span>No open positions</span></div>';
  }else{
    var h='';
    for(var i=0;i<d.positions.length;i++){
      var x=d.positions[i];
      h+='<div class="pos-row">'+
        '<span>'+x.symbol+'</span>'+
        '<span class="'+(x.side==='LONG'?'g':'r')+'">'+x.side+' '+x.qty.toFixed(4)+'</span>'+
        '<span>$'+x.entry.toFixed(2)+'</span>'+
        '<span class="'+(x.unreal>=0?'g':'r')+'">'+(x.unreal>=0?'+':'')+'$'+x.unreal.toFixed(2)+'</span>'+
        '<span><button onclick="alert(\'Manual close coming soon\')">Close</button></span>'+
        '</div>';
    }
    pos.innerHTML=h;
  }
  document.getElementById('last').textContent='Updated: '+new Date().toLocaleTimeString();
}

async function load(){
  try{
    var r=await fetch('/api/data');
    var d=await r.json();
    if(d.error){alert('API Error - check connection');return;}
    render(d);
  }catch(e){alert('Connection failed');}
}

load();
setInterval(load,60000);
</script>
</body>
</html>"""

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/data':
            d = get_data()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(d).encode())
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(HTML.encode())

    def log_message(self, fmt, *args): pass

HTTPServer(('', PORT), H).serve_forever()

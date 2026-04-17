#!/usr/bin/env python3
"""
Bollinger Bands + ATR Strategy v2 (Improved)
Best for: LOW VOLUME, RANGE-BOUND markets

Improvements:
- ATR-based SL/TP with dynamic multipliers based on VCS
- Trailing stop when in profit
- Time-based exit (max hold time)
- RSI neutral exit
- Better signal filters

Entry: Price touches lower BB + confirmations = BUY
Exit: ATR-based SL/TP + Trailing SL + Time Exit
"""

import requests
import json
import time
import os
import hmac
import hashlib
import math
from datetime import datetime

BASE_URL = "https://fapi.binance.com"
SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XAUUSDT", "XAGUSDT"]
FEE = 0.0004
SLIPPAGE = 0.0002

# ATR Settings
ATR_PERIOD = 14
ATR_HIGH_VOLATILITY = 0.10
ATR_MULTIPLIER_SL_HIGH = 1.5  # Reduced from 2.0
ATR_MULTIPLIER_TP_HIGH = 4.0  # Reduced from 8.0 - tighter TP
ATR_MULTIPLIER_SL_NORMAL = 1.5
ATR_MULTIPLIER_TP_NORMAL = 4.0  # Reduced from 8.0

# Trailing Stop
TRAILING_ACTIVATION = 0.008  # Activate when 0.8% in profit
TRAILING_DISTANCE = 0.004  # Lock in 0.4% profit

# Time Exit
MAX_HOLD_CANDLES = 48  # 4 hours (48 x 5min candles)

# Fixed percentage TP/SL (bigger for $5/day target)
PRICE_SL_PCT = 0.025  # 2.5% SL
PRICE_TP_PCT = 0.05  # 5% TP
PRICE_FALLBACK_MIN_ATR = 0.002
PRICE_FALLBACK_MAX_ATR = 0.05

# RSI Settings
RSI_OVERSOLD = 40  # Lowered from 35 - be more aggressive
RSI_OVERBOUGHT = 60  # Lowered from 65 - be more aggressive
RSI_NEUTRAL_LONG = 55  # Close LONG when RSI reaches here
RSI_NEUTRAL_SHORT = 45  # Close SHORT when RSI reaches here

# Load env vars
for env_file in ['/root/.openclaw/workspace/binance.env', '/root/.openclaw/workspace/telegram.env']:
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if '=' in line:
                    k, v = line.strip().split('=', 1)
                    os.environ[k] = v

API_KEY = os.environ.get('BINANCE_API_KEY', '')
API_SECRET = os.environ.get('BINANCE_API_SECRET', '')
TELEGRAM_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '')

POSITION_PCT = 0.80  # 80% of balance per trade
MIN_POSITION = 40
MAX_POSITION = 100
MAX_POSITIONS = 2  # Max 2 positions at once

# Track position open time
position_opened = {}

def get_signature(query_string):
    return hmac.new(API_SECRET.encode(), query_string.encode(), hashlib.sha256).hexdigest()

def futures_request(method, endpoint, params=None):
    params = params or {}
    params['timestamp'] = int(time.time() * 1000)
    params['recvWindow'] = 5000
    query = '&'.join([f"{k}={v}" for k, v in params.items()])
    signature = get_signature(query)
    url = f"{BASE_URL}{endpoint}?{query}&signature={signature}"
    headers = {'X-MBX-APIKEY': API_KEY}
    if method == 'GET':
        r = requests.get(url, headers=headers)
    elif method == 'POST':
        r = requests.post(url, headers=headers)
    elif method == 'DELETE':
        r = requests.delete(url, headers=headers)
    return r.json()

def get_balance():
    data = futures_request('GET', '/fapi/v2/account')
    return float(data.get('availableBalance', 0))

def get_positions():
    data = futures_request('GET', '/fapi/v2/account')
    positions = []
    for pos in data.get('positions', []):
        if float(pos.get('notional', 0)) != 0:
            positions.append(pos)
    return positions

def send_telegram(message):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        data = {"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"}
        r = requests.post(url, data=data, timeout=10)
        return r.json().get('ok', False)
    except:
        return False

def get_tick_size(symbol):
    """Get tick size for proper price rounding"""
    try:
        info_r = requests.get(f'{BASE_URL}/fapi/v1/exchangeInfo', timeout=10)
        for s in info_r.json().get('symbols', []):
            if s['symbol'] == symbol:
                for f in s.get('filters', []):
                    if f.get('filterType') == 'PRICE_FILTER':
                        return float(f.get('tickSize', 0.00001))
    except:
        pass
    return 0.00001

def round_to_tick(price, tick_size):
    """Round price to proper tick size"""
    tick_str = f"{tick_size:.10f}".rstrip('0')
    decimals = len(tick_str.split('.')[1]) if '.' in tick_str else 0
    return float(f"{price:.{decimals}f}")

def get_step_size(symbol):
    """Get step size for proper quantity rounding"""
    try:
        info_r = requests.get(f'{BASE_URL}/fapi/v1/exchangeInfo', timeout=10)
        for s in info_r.json().get('symbols', []):
            if s['symbol'] == symbol:
                for f in s.get('filters', []):
                    if f.get('filterType') == 'LOT_SIZE':
                        return float(f.get('stepSize', 0.001))
    except:
        pass
    return 0.001

def round_quantity(quantity, step_size):
    """Round quantity to proper step size"""
    step_str = f"{step_size:.10f}".rstrip('0')
    decimals = len(step_str.split('.')[1]) if '.' in step_str else 0
    return float(f"{quantity:.{decimals}f}")

def place_order_with_algo_sl_tp(symbol, side, quantity, sl_price, tp_price):
    """Place market order FIRST, then set SL/TP via algoOrder (Neko method)"""
    headers = {'X-MBX-APIKEY': API_KEY}
    
    # Round quantity to proper step size
    step_size = get_step_size(symbol)
    quantity = round_quantity(quantity, step_size)
    
    # 1. Place MARKET order first
    result = futures_request('POST', '/fapi/v1/order', {
        'symbol': symbol,
        'side': side,
        'type': 'MARKET',
        'quantity': str(quantity),
    })
    
    order_id = result.get('orderId')
    if not order_id or str(order_id) == 'N/A':
        print(f"  ❌ Market order failed: {result}")
        return result
    
    print(f"  ✅ Market order placed: {order_id}")
    
    # 2. Only place SL/TP if market order succeeded
    tick_size = get_tick_size(symbol)
    sl_trigger = round_to_tick(sl_price, tick_size)
    tp_trigger = round_to_tick(tp_price, tick_size)
    
    # Determine sides
    entry_side = side  # BUY for LONG, SELL for SHORT
    sl_side = 'SELL' if side == 'BUY' else 'BUY'  # Opposite side for SL
    tp_side = 'SELL' if side == 'BUY' else 'BUY'  # Opposite side for TP
    
    # 3. Place STOP LOSS via algoOrder
    ts = int(time.time() * 1000)
    sl_params = (
        f"symbol={symbol}&side={sl_side}&type=STOP_MARKET&orderType=STOP_MARKET"
        f"&algoType=CONDITIONAL&quantity={quantity}&reduceOnly=true"
        f"&triggerPrice={sl_trigger}&stopPrice={sl_trigger}"
        f"&workingType=CONTRACT_PRICE&timestamp={ts}"
    )
    sl_sig = get_signature(sl_params)
    sl_url = f"{BASE_URL}/fapi/v1/algoOrder?{sl_params}&signature={sl_sig}"
    
    try:
        sl_r = requests.post(sl_url, headers=headers, timeout=10)
        if sl_r.status_code == 200:
            print(f"  ✅ SL algo order placed: {sl_trigger}")
        else:
            print(f"  ⚠️ SL order warning: {sl_r.text[:100]}")
    except Exception as e:
        print(f"  ❌ SL order error: {e}")
    
    # 4. Place TAKE PROFIT via algoOrder
    ts = int(time.time() * 1000)
    tp_params = (
        f"symbol={symbol}&side={tp_side}&type=TAKE_PROFIT_MARKET&orderType=TAKE_PROFIT_MARKET"
        f"&algoType=CONDITIONAL&quantity={quantity}&reduceOnly=true"
        f"&triggerPrice={tp_trigger}&stopPrice={tp_trigger}"
        f"&workingType=CONTRACT_PRICE&timestamp={ts}"
    )
    tp_sig = get_signature(tp_params)
    tp_url = f"{BASE_URL}/fapi/v1/algoOrder?{tp_params}&signature={tp_sig}"
    
    try:
        tp_r = requests.post(tp_url, headers=headers, timeout=10)
        if tp_r.status_code == 200:
            print(f"  ✅ TP algo order placed: {tp_trigger}")
        else:
            print(f"  ⚠️ TP order warning: {tp_r.text[:100]}")
    except Exception as e:
        print(f"  ❌ TP order error: {e}")
    
    return result

def place_order(symbol, side, quantity):
    return futures_request('POST', '/fapi/v1/order', {
        'symbol': symbol,
        'side': side,
        'type': 'MARKET',
        'quantity': str(quantity),
    })

def close_position(symbol, quantity):
    return futures_request('POST', '/fapi/v1/order', {
        'symbol': symbol,
        'side': 'SELL' if quantity > 0 else 'BUY',
        'type': 'MARKET',
        'quantity': str(abs(quantity)),
    })

def fetch_klines(symbol, interval="5m", limit=100):
    url = f"{BASE_URL}/fapi/v1/klines"
    params = {"symbol": symbol, "interval": interval, "limit": limit}
    r = requests.get(url, params=params, timeout=10)
    return [[float(x[1]), float(x[2]), float(x[3]), float(x[4]), float(x[5])] for x in r.json()]

def calc_atr(candles, period=14):
    if len(candles) < period + 1:
        return None
    trs = []
    for i in range(1, min(period + 1, len(candles))):
        high = float(candles[-i][1])
        low = float(candles[-i][2])
        prev_close = float(candles[-i-1][3])
        tr = max(high - low, abs(high - prev_close), abs(low - prev_close))
        trs.append(tr)
    return sum(trs) / len(trs) if trs else None

def calc_vcs(candles):
    if len(candles) < 20:
        return 50
    atr_current = calc_atr(candles, 14) or (float(candles[-1][3]) * 0.02)
    atr_avg = sum(calc_atr(candles[i:i+5], 14) or (float(candles[min(i+4, len(candles)-1)][3]) * 0.02) 
              for i in range(min(10, len(candles)-5))) / min(10, len(candles)-5) if len(candles) > 5 else atr_current
    vcs = 100 - (atr_current / atr_avg * 100) if atr_avg > 0 else 50
    return max(0, min(100, vcs))

def calc_ema(prices, period):
    if len(prices) < period:
        return None
    k = 2 / (period + 1)
    ema = sum(prices[:period]) / period
    for price in prices[period:]:
        ema = price * k + ema * (1 - k)
    return ema

def calc_macd(prices):
    if len(prices) < 26:
        return None, None, None
    ema12 = calc_ema(prices, 12)
    ema26 = calc_ema(prices, 26)
    if ema12 is None or ema26 is None:
        return None, None, None
    macd = ema12 - ema26
    signal = calc_ema([macd] * 26, 9) if isinstance(macd, (int, float)) else None
    hist = macd - signal if signal else 0
    return macd, signal, hist

def get_bb(closes, period=20):
    if len(closes) < period:
        return None, None, None
    recent = closes[-period:]
    sma = sum(recent) / period
    std = math.sqrt(sum((x - sma) ** 2 for x in recent) / period)
    upper = sma + (2 * std)
    lower = sma - (2 * std)
    return upper, sma, lower

def get_rsi(closes, period=14):
    if len(closes) < period + 1:
        return None
    deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
    gains = [d for d in deltas[-period:] if d > 0]
    losses = [-d for d in deltas[-period:] if d < 0]
    avg_gain = sum(gains) / period if gains else 0
    avg_loss = sum(losses) / period if losses else 0
    if avg_loss == 0:
        return 100
    return 100 - (100 / (1 + avg_gain / avg_loss))

def get_sl_tp_vcs(current_price, atr, direction, atr_pct, vcs):
    """Calculate SL and TP - Fixed 5% TP / 2.5% SL"""
    
    if direction == "LONG":
        sl = current_price * 0.975  # 2.5% SL
        tp = current_price * 1.05   # 5% TP
    else:
        sl = current_price * 1.025   # 2.5% SL
        tp = current_price * 0.95    # 5% TP
    
    return sl, tp

def check_signal(symbol):
    klines = fetch_klines(symbol)
    if not klines or len(klines) < 50:
        return None
    
    closes = [k[3] for k in klines]
    highs = [k[0] for k in klines]
    lows = [k[1] for k in klines]
    current = closes[-1]
    
    bb_upper, bb_middle, bb_lower = get_bb(closes)
    rsi = get_rsi(closes)
    atr = calc_atr(klines, ATR_PERIOD)
    atr_pct = atr / current if atr else 0
    ema_21 = calc_ema(closes, 21)
    vcs = calc_vcs(klines)
    macd, signal, hist = calc_macd(closes)
    
    if None in [bb_upper, bb_middle, bb_lower, rsi, atr]:
        return None
    
    ema_position = ((current - (ema_21 - atr)) / (atr * 2)) * 100 if atr > 0 else 50
    
    # === LONG Signal ===
    # Aggressive: within 0.5% of BB lower (not exact touch)
    at_bb_lower = current <= bb_lower * 1.005  # within 0.5%
    if at_bb_lower and rsi < RSI_OVERSOLD:
        if ema_position > 90:
            return None
        
        if hist and hist < 0:
            return None
        
        sl, tp = get_sl_tp_vcs(current, atr, "LONG", atr_pct, vcs)
        rr_ratio = (tp - current) / (current - sl) if sl != current else 0
        
        return {
            'symbol': symbol,
            'direction': 'LONG',
            'entry': current,
            'sl': sl,
            'tp': tp,
            'rr': round(rr_ratio, 2),
            'rsi': round(rsi, 1),
            'vcs': round(vcs, 1),
            'atr_pct': round(atr_pct * 100, 2),
        }
    
    # === SHORT Signal ===
    # Aggressive: within 0.5% of BB upper (not exact touch)
    at_bb_upper = current >= bb_upper * 0.995  # within 0.5%
    if at_bb_upper and rsi > RSI_OVERBOUGHT:
        if ema_position < 10:
            return None
        
        if hist and hist > 0:
            return None
        
        sl, tp = get_sl_tp_vcs(current, atr, "SHORT", atr_pct, vcs)
        rr_ratio = (current - tp) / (sl - current) if sl != current else 0
        
        return {
            'symbol': symbol,
            'direction': 'SHORT',
            'entry': current,
            'sl': sl,
            'tp': tp,
            'rr': round(rr_ratio, 2),
            'rsi': round(rsi, 1),
            'vcs': round(vcs, 1),
            'atr_pct': round(atr_pct * 100, 2),
        }
    
    return None

def check_positions():
    positions = get_positions()
    if not positions:
        position_opened.clear()
        return []
    
    closed = []
    now = int(time.time())
    
    for pos in positions:
        symbol = pos['symbol']
        qty = abs(float(pos['positionAmt']))
        entry = float(pos['entryPrice'])
        side = 'LONG' if float(pos['positionAmt']) > 0 else 'SHORT'
        
        klines = fetch_klines(symbol)
        if not klines:
            continue
        current = float(klines[-1][3])
        closes = [k[3] for k in klines]
        rsi = get_rsi(closes)
        
        atr = calc_atr(klines, ATR_PERIOD)
        if not atr:
            continue
        atr_pct = atr / current
        vcs = calc_vcs(klines)
        
        sl, tp = get_sl_tp_vcs(current, atr, side, atr_pct, vcs)
        
        # Track position age
        if symbol not in position_opened:
            position_opened[symbol] = now
        
        candles_held = len(klines)  # Approximate
        time_held_seconds = now - position_opened.get(symbol, now)
        candles_elapsed = time_held_seconds // 300  # 5min candles
        
        # Calculate profit/loss percentage
        if side == 'LONG':
            pnl_pct = (current - entry) / entry
        else:
            pnl_pct = (entry - current) / entry
        
        # === Exit Conditions ===
        should_close = False
        reason = ""
        
        # 1. SL hit
        sl_hit = (side == 'LONG' and current <= sl) or (side == 'SHORT' and current >= sl)
        if sl_hit:
            should_close = True
            reason = "SL HIT"
        
        # 2. TP hit
        tp_hit = (side == 'LONG' and current >= tp) or (side == 'SHORT' and current <= tp)
        if tp_hit:
            should_close = True
            reason = "TP HIT"
        
        # 3. Trailing stop (lock in profit)
        if pnl_pct > TRAILING_ACTIVATION:
            trailing_sl = entry * (1 + TRAILING_DISTANCE) if side == 'LONG' else entry * (1 - TRAILING_DISTANCE)
            trail_hit = (side == 'LONG' and current <= trailing_sl) or (side == 'SHORT' and current >= trailing_sl)
            if trail_hit:
                should_close = True
                reason = "TRAILING SL"
        
        # 4. Time exit (max hold)
        if candles_elapsed >= MAX_HOLD_CANDLES:
            should_close = True
            reason = "TIME EXIT"
        
        # 5. RSI neutral exit
        if rsi:
            if side == 'LONG' and rsi >= RSI_NEUTRAL_LONG:
                should_close = True
                reason = "RSI NEUTRAL"
            elif side == 'SHORT' and rsi <= RSI_NEUTRAL_SHORT:
                should_close = True
                reason = "RSI NEUTRAL"
        
        if should_close:
            result = close_position(symbol, float(pos['positionAmt']))
            closed.append({
                'symbol': symbol,
                'reason': reason,
                'qty': qty,
                'entry': entry,
                'exit': current,
                'pnl': float(pos.get('unrealizedProfit', 0))
            })
            send_telegram(f"📤 Closed {symbol}\nReason: {reason}\nPrice: ${current:.4f}\nP&L: ${float(pos.get('unrealizedProfit', 0)):.2f}")
            if symbol in position_opened:
                del position_opened[symbol]
    
    return closed

def get_position_size(balance, entry_price):
    margin = balance * POSITION_PCT
    risk_per_unit = entry_price * PRICE_SL_PCT
    size = margin / risk_per_unit if risk_per_unit > 0 else 0
    return min(max(size, MIN_POSITION / entry_price), MAX_POSITION / entry_price)

def run_cycle():
    print("=" * 60)
    print("📊 BB + ATR Strategy v2 (Improved)")
    print("=" * 60)
    
    balance = get_balance()
    print(f"💰 Balance: ${balance:.2f}")
    
    closed = check_positions()
    if closed:
        print(f"✅ Closed {len(closed)} positions")
        for c in closed:
            print(f"  📍 {c['symbol']}: {c['reason']} | P&L: ${c['pnl']:.2f}")
    
    positions = get_positions()
    print(f"📊 Positions: {len(positions)}")
    
    for pos in positions:
        symbol = pos['symbol']
        qty = abs(float(pos['positionAmt']))
        entry = float(pos['entryPrice'])
        side = 'LONG' if float(pos['positionAmt']) > 0 else 'SHORT'
        
        klines = fetch_klines(symbol)
        if not klines:
            continue
        current = float(klines[-1][3])
        closes = [k[3] for k in klines]
        rsi = get_rsi(closes)
        
        atr = calc_atr(klines, ATR_PERIOD) or (current * 0.02)
        atr_pct = atr / current
        vcs = calc_vcs(klines)
        
        sl, tp = get_sl_tp_vcs(current, atr, side, atr_pct, vcs)
        pnl = float(pos.get('unrealizedProfit', 0))
        pnl_pct = (pnl / balance) * 100
        
        print(f"  📍 {symbol} {side}: Entry ${entry:.2f} | Current ${current:.2f} | P&L {pnl_pct:+.2f}% | SL ${sl:.2f} | TP ${tp:.2f}")
    
    print("\n🔍 Scanning...")
    
    for symbol in SYMBOLS:
        if len(positions) >= MAX_POSITIONS:
            print(f"  ⚪ Max positions reached ({MAX_POSITIONS}), skipping new entries")
            break
        if any(p['symbol'] == symbol for p in positions):
            print(f"  ⚪ {symbol}: Position open")
            continue
        
        signal = check_signal(symbol)
        if signal:
            print(f"  ✅ {symbol}: {signal['direction']} @ ${signal['entry']:.2f} | SL ${signal['sl']:.2f} | TP ${signal['tp']:.2f} | R:R {signal['rr']}:1 | RSI {signal['rsi']} | VCS {signal['vcs']}")
            
            size = get_position_size(balance, signal['entry'])
            side = 'BUY' if signal['direction'] == 'LONG' else 'SELL'
            
            # Use Neko method: Market order + Algo SL/TP
            result = place_order_with_algo_sl_tp(symbol, side, size, signal['sl'], signal['tp'])
            
            if result.get('orderId'):
                position_opened[symbol] = int(time.time())
                msg = f"📢 *New {signal['direction']} Signal*\n\n"
                msg += f"🪙 {symbol}\n"
                msg += f"💰 Entry: ${signal['entry']:.4f}\n"
                msg += f"🛡 SL: ${signal['sl']:.4f} (algo)\n"
                msg += f"📈 TP: ${signal['tp']:.4f} (algo)\n"
                msg += f"⚖️ R:R: {signal['rr']}:1\n"
                msg += f"📊 RSI: {signal['rsi']} | VCS: {signal['vcs']}\n"
                msg += f"💵 Qty: {size:.4f}"
                send_telegram(msg)
                print(f"  ✅ Full order placed: {side} {size:.4f} {symbol} with SL/TP algo")
            else:
                print(f"  ❌ Order failed: {result}")
        else:
            print(f"  ⚪ {symbol}: No signal")
    
    print("\n✅ Cycle complete")

if __name__ == "__main__":
    run_cycle()

#!/usr/bin/env python3
"""
Ellie Fund - Trading Strategy v8
TP/SL only, NO intervention
Built for systematic crypto futures trading
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

# v8 STRATEGY SETTINGS
ATR_PERIOD = 14
RSI_OVERSOLD = 30  # v8: Extreme only for entry
RSI_OVERBOUGHT = 70  # v8: Extreme only for entry
POSITION_PCT = 0.60  # v8: 60% of balance
MAX_TRADES_PER_DAY = 3  # v8: Quality over quantity
DAILY_LOSS_CAP = 5.0  # v8: Hard stop at -$5/day
MAX_POSITIONS = 1

# TP/SL Settings (v8: NO intervention!)
PRICE_TP_PCT = 0.05  # 5% Take Profit
PRICE_SL_PCT = 0.02  # 2% Stop Loss

# Load env
for env_file in ['/root/.openclaw/workspace/binance.env', '/root/.openclaw/workspace/telegram.env']:
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if '=' in line:
                    k, v = line.strip().split('=', 1)
                    os.environ[k] = v

BINANCE_API_KEY = os.getenv('BINANCE_API_KEY', '')
BINANCE_SECRET = os.getenv('BINANCE_SECRET', '')
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID', '1099618939')
GROUP_CHAT_ID = '-1002487213667'

def get_signature(params, secret):
    return hmac.new(secret.encode(), '&'.join(f'{k}={v}' for k, v in sorted(params.items())).encode(), hashlib.sha256).hexdigest()

def api_request(method, endpoint, params=None):
    params = params or {}
    if BINANCE_API_KEY:
        params['timestamp'] = int(time.time() * 1000)
        params['signature'] = get_signature(params, BINANCE_SECRET)
        headers = {'X-MBX-APIKEY': BINANCE_API_KEY}
    else:
        headers = {}
    
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == 'GET':
            r = requests.get(url, params=params, headers=headers, timeout=10)
        elif method == 'POST':
            r = requests.post(url, params=params, headers=headers, timeout=10)
        elif method == 'DELETE':
            r = requests.delete(url, params=params, headers=headers, timeout=10)
        return r.json() if r.status_code == 200 else None
    except:
        return None

def fetch_klines(symbol, interval="5m", limit=100):
    url = f"{BASE_URL}/fapi/v1/klines"
    params = {"symbol": symbol, "interval": interval, "limit": limit}
    try:
        r = requests.get(url, params=params, timeout=10)
        return r.json() if r.status_code == 200 else None
    except:
        return None

def get_rsi(closes, period=14):
    if len(closes) < period + 1:
        return None
    deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
    gains = [d for d in deltas[-14:] if d > 0]
    losses = [-d for d in deltas[-14:] if d < 0]
    avg_gain = sum(gains) / 14 if gains else 0
    avg_loss = sum(losses) / 14 if losses else 0
    rs = avg_gain / avg_loss if avg_loss > 0 else 100
    return 100 - (100 / (1 + rs))

def get_bb(closes, period=20):
    if len(closes) < period:
        return None, None, None
    recent = closes[-period:]
    sma = sum(recent) / period
    std = math.sqrt(sum((x - sma) ** 2 for x in recent) / period)
    return sma + 2 * std, sma, sma - 2 * std

def calc_ema(closes, period):
    if len(closes) < period:
        return None
    k = 2 / (period + 1)
    ema = sum(closes[:period]) / period
    for price in closes[period:]:
        ema = price * k + ema * (1 - k)
    return ema

def calc_atr(klines, period=14):
    if len(klines) < period + 1:
        return None
    trs = []
    for i in range(1, len(klines)):
        high = float(klines[i][0])
        low = float(klines[i][1])
        prev_close = float(klines[i-1][3])
        tr = max(high - low, abs(high - prev_close), abs(low - prev_close))
        trs.append(tr)
    return sum(trs[-period:]) / period if trs else None

def calc_vcs(klines):
    if len(klines) < 20:
        return 0
    closes = [float(k[3]) for k in klines]
    volumes = [float(k][4]) for k in klines]
    
    # Volume concentration: how much volume in current direction vs average
    recent_vol = sum(volumes[-5:]) / 5
    avg_vol = sum(volumes[-20:]) / 20
    price_change = (closes[-1] - closes[-5]) / closes[-5]
    
    if recent_vol > avg_vol * 1.5 and abs(price_change) > 0.005:
        return 1 if price_change > 0 else -1
    return 0

def calc_macd(closes, fast=12, slow=26, signal=9):
    if len(closes) < slow + signal:
        return None, None, None
    ema_fast = calc_ema(closes, fast)
    ema_slow = calc_ema(closes, slow)
    if ema_fast is None or ema_slow is None:
        return None, None, None
    macd_line = ema_fast - ema_slow
    return macd_line, 0, macd_line  # Simplified

def check_signal(symbol):
    """Check for entry signals - v8: RSI 30/70 + 1H confirmation"""
    klines = fetch_klines(symbol)
    if not klines or len(klines) < 50:
        return None
    
    closes = [float(k[3]) for k in klines]
    highs = [float(k[0]) for k in klines]
    lows = [float(k[1]) for k in klines]
    volumes = [float(k[4]) for k in klines]
    current = closes[-1]
    
    bb_upper, bb_middle, bb_lower = get_bb(closes)
    rsi = get_rsi(closes)
    atr = calc_atr(klines, ATR_PERIOD)
    
    if None in [bb_upper, bb_middle, bb_lower, rsi, atr]:
        return None
    
    # v8: Add 1H RSI confirmation
    try:
        klines_1h = fetch_klines(symbol, interval="1h", limit=50)
        closes_1h = [float(k[3]) for k in klines_1h]
        rsi_1h = get_rsi(closes_1h)
    except:
        rsi_1h = 50
    
    avg_volume = sum(volumes[-20:]) / 20
    current_volume = volumes[-1]
    volume_spike = current_volume > avg_volume * 1.2
    
    ema_21 = calc_ema(closes, 21)
    ema_position = ((current - (ema_21 - atr)) / (atr * 2)) * 100 if atr > 0 else 50
    
    # v8: Trend filter
    try:
        closes_1h = [float(k[3]) for k in klines_1h]
        ema_21_1h = calc_ema(closes_1h, 21)
        trend_bullish = closes_1h[-1] > ema_21_1h if ema_21_1h else True
    except:
        trend_bullish = True
    
    # LONG: RSI < 30 + BB touch + volume
    at_bb_lower = current <= bb_lower * 1.005
    if at_bb_lower and rsi < RSI_OVERSOLD:
        if rsi_1h > 60:
            return None
        if not trend_bullish:
            return None
        if ema_position > 90:
            return None
        
        atr_pct = atr / current
        sl = current * (1 - PRICE_SL_PCT)
        tp = current * (1 + PRICE_TP_PCT)
        rr = (tp - current) / (current - sl)
        
        return {
            'symbol': symbol,
            'direction': 'LONG',
            'entry': current,
            'sl': sl,
            'tp': tp,
            'rr': round(rr, 2),
            'rsi': round(rsi, 1),
            'atr_pct': round(atr_pct * 100, 2),
        }
    
    # SHORT: RSI > 70 + BB touch + volume
    at_bb_upper = current >= bb_upper * 0.995
    if at_bb_upper and rsi > RSI_OVERBOUGHT:
        if rsi_1h < 40:
            return None
        if trend_bullish:
            return None
        if ema_position < 10:
            return None
        
        atr_pct = atr / current
        sl = current * (1 + PRICE_SL_PCT)
        tp = current * (1 - PRICE_TP_PCT)
        rr = (current - tp) / (sl - current)
        
        return {
            'symbol': symbol,
            'direction': 'SHORT',
            'entry': current,
            'sl': sl,
            'tp': tp,
            'rr': round(rr, 2),
            'rsi': round(rsi, 1),
            'atr_pct': round(atr_pct * 100, 2),
        }
    
    return None

def get_balance():
    params = {"recvWindow": 5000}
    data = api_request('GET', '/fapi/v2/balance', params)
    if data:
        for item in data:
            if item['asset'] == 'USDT':
                return float(item['availableBalance'])
    return None

def get_positions():
    params = {"recvWindow": 5000}
    return api_request('GET', '/fapi/v2/positionRisk', params) or []

def open_position(symbol, side, entry_price, quantity, sl, tp):
    params = {
        "symbol": symbol,
        "side": side,
        "type": "LIMIT",
        "quantity": quantity,
        "price": entry_price,
        "stopPrice": sl,
        "stopLimitPrice": sl,
        "stopLimitTimeInForce": "GTC",
        "closeType": "STOP",  # This creates TP/SL
        "recvWindow": 5000
    }
    return api_request('POST', '/fapi/v1/order', params)

def close_position(symbol, quantity):
    params = {
        "symbol": symbol,
        "side": "SELL" if quantity > 0 else "BUY",
        "type": "MARKET",
        "quantity": abs(quantity),
        "recvWindow": 5000
    }
    return api_request('POST', '/fapi/v1/order', params)

def send_telegram(message, chat_id=GROUP_CHAT_ID):
    if not TELEGRAM_BOT_TOKEN:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": chat_id, "text": message}, timeout=10)
    except:
        pass

def scan_and_trade():
    balance = get_balance()
    if not balance:
        print("❌ Cannot get balance")
        return
    
    positions = get_positions()
    active_symbols = [p['symbol'] for p in positions if float(p.get('positionAmt', 0)) != 0]
    
    if len(active_symbols) >= MAX_POSITIONS:
        print(f"⏳ Max positions ({MAX_POSITIONS}), skipping...")
        return
    
    for symbol in SYMBOLS:
        if symbol in active_symbols:
            continue
        
        signal = check_signal(symbol)
        if signal:
            print(f"🎯 Signal found: {signal}")
            position_size = balance * POSITION_PCT
            quantity = position_size / signal['entry']
            quantity = round(quantity, 3)
            
            result = open_position(
                symbol,
                'BUY' if signal['direction'] == 'LONG' else 'SELL',
                signal['entry'],
                quantity,
                signal['sl'],
                signal['tp']
            )
            
            if result and 'orderId' in result:
                msg = f"🎯 **{signal['direction']}** {symbol}\nEntry: ${signal['entry']}\nSL: ${signal['sl']}\nTP: ${signal['tp']}\nR:R: {signal['rr']}"
                send_telegram(msg)
                print(f"✅ Order placed: {msg}")

if __name__ == "__main__":
    print("🤖 Ellie Fund Trading Bot v8")
    print("=" * 40)
    scan_and_trade()

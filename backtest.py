#!/usr/bin/env python3
"""
Backtest - SKILL.md Strategy (Simple Scalper)
RSI < 30 + below EMA21 + Volume > 2x
SL: -0.5%, TP: +2%
"""

import requests
import math
import time

BASE_URL = "https://fapi.binance.com"

# Strategy params from SKILL.md
RSI_OVERSOLD = 30
RSI_OVERBOUGHT = 70
VOL_MULT = 2.0
SL_PCT = 0.005  # 0.5%
TP_PCT = 0.02   # 2.0%
EMA_PERIOD = 21

def fetch_klines(symbol, interval="5m", limit=500, start_time=None):
    url = f"{BASE_URL}/fapi/v1/klines"
    params = {"symbol": symbol, "interval": interval, "limit": limit}
    if start_time:
        params["startTime"] = start_time
    r = requests.get(url, params=params, timeout=30)
    return [[float(x[1]), float(x[2]), float(x[3]), float(x[4]), float(x[5]), int(x[0])] for x in r.json()]

def calc_ema(prices, period):
    if len(prices) < period:
        return None
    k = 2 / (period + 1)
    ema = sum(prices[:period]) / period
    for price in prices[period:]:
        ema = price * k + ema * (1 - k)
    return ema

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

def get_vol(candles):
    if len(candles) < 20:
        return 0
    vols = [float(c[4]) for c in candles[-20:]]
    avg = sum(vols) / len(vols)
    return vols[-1] / avg if avg > 0 else 0

def backtest_scalper(symbol, days=30, initial_balance=100):
    end_time = int(time.time() * 1000)
    start_time = end_time - (days * 24 * 60 * 60 * 1000)
    
    klines = fetch_klines(symbol, "5m", 500, start_time)
    if not klines or len(klines) < 50:
        return None
    
    balance = initial_balance
    trades = []
    wins = 0
    losses = 0
    max_dd = 0
    peak = balance
    in_position = None
    
    i = 25
    while i < len(klines) - 3:
        closes = [k[3] for k in klines[:i]]
        highs = [k[1] for k in klines[:i]]
        lows = [k[1] for k in klines[:i]]
        volumes = [float(k[4]) for k in klines[:i]]
        current = klines[i][3]
        
        rsi = get_rsi(closes)
        ema = calc_ema(closes, EMA_PERIOD)
        vol_ratio = get_vol(klines[:i])
        
        if rsi is None or ema is None:
            i += 1
            continue
        
        # === ENTRY ===
        if in_position is None:
            direction = None
            
            # LONG: RSI < 30 + below EMA21 + Volume > 2x
            if rsi < RSI_OVERSOLD and current < ema and vol_ratio > VOL_MULT:
                direction = "LONG"
            
            # SHORT: RSI > 70 + above EMA21 + Volume > 2x
            elif rsi > RSI_OVERBOUGHT and current > ema and vol_ratio > VOL_MULT:
                direction = "SHORT"
            
            if direction:
                entry = current
                if direction == "LONG":
                    sl = entry * (1 - SL_PCT)
                    tp = entry * (1 + TP_PCT)
                else:
                    sl = entry * (1 + SL_PCT)
                    tp = entry * (1 - TP_PCT)
                
                in_position = {'direction': direction, 'entry': entry, 'sl': sl, 'tp': tp}
                i += 1
                continue
        
        # === EXIT ===
        if in_position:
            direction = in_position['direction']
            sl = in_position['sl']
            tp = in_position['tp']
            entry = in_position['entry']
            
            for j in range(i + 1, min(i + 60, len(klines))):  # Max 5 hours
                high = klines[j][1]
                low = klines[j][2]
                
                hit_sl = (direction == "LONG" and low <= sl) or (direction == "SHORT" and high >= sl)
                hit_tp = (direction == "LONG" and high >= tp) or (direction == "SHORT" and low <= tp)
                
                if hit_sl or hit_tp:
                    exit_price = sl if hit_sl else tp
                    pnl_pct = (exit_price - entry) / entry if direction == "LONG" else (entry - exit_price) / entry
                    fee = entry * 0.0004 + exit_price * 0.0004
                    net_pnl = pnl_pct - fee/entry
                    pnl = balance * net_pnl
                    
                    balance += pnl
                    trades.append({'pnl': pnl, 'pnl_pct': net_pnl * 100, 'reason': 'SL' if hit_sl else 'TP'})
                    
                    if pnl > 0:
                        wins += 1
                    else:
                        losses += 1
                    
                    if balance > peak:
                        peak = balance
                    dd = (peak - balance) / peak * 100 if peak > 0 else 0
                    if dd > max_dd:
                        max_dd = dd
                    
                    in_position = None
                    i = j + 1
                    break
            
            if in_position:
                i += 1
        else:
            i += 1
    
    total = wins + losses
    return {
        'symbol': symbol,
        'trades': len(trades),
        'wins': wins,
        'losses': losses,
        'winrate': (wins / total * 100) if total > 0 else 0,
        'final_balance': balance,
        'total_pnl': balance - initial_balance,
        'pnl_pct': (balance - initial_balance) / initial_balance * 100,
        'max_dd': max_dd,
    }

def run_backtest():
    print("=" * 70)
    print("📊 BACKTEST - SKILL.md Scalper Strategy")
    print("=" * 70)
    print(f"Entry: RSI < {RSI_OVERSOLD} + below EMA{EMA_PERIOD} + Vol > {VOL_MULT}x")
    print(f"SL: {SL_PCT*100}% | TP: {TP_PCT*100}%")
    print("=" * 70)
    
    symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"]
    days = 30
    initial_balance = 100
    
    all_results = []
    
    for symbol in symbols:
        print(f"\n🔍 Testing {symbol}...")
        result = backtest_scalper(symbol, days, initial_balance)
        
        if result:
            print(f"   Trades: {result['trades']}")
            print(f"   W/L: {result['wins']}/{result['losses']}")
            print(f"   Win Rate: {result['winrate']:.1f}%")
            print(f"   P&L: ${result['total_pnl']:.2f} ({result['pnl_pct']:+.1f}%)")
            print(f"   Max DD: {result['max_dd']:.1f}%")
            all_results.append(result)
    
    print("\n" + "=" * 70)
    print("📈 SUMMARY")
    print("=" * 70)
    
    total_trades = sum(r['trades'] for r in all_results)
    total_wins = sum(r['wins'] for r in all_results)
    total_losses = sum(r['losses'] for r in all_results)
    avg_winrate = sum(r['winrate'] for r in all_results) / len(all_results) if all_results else 0
    avg_pnl = sum(r['total_pnl'] for r in all_results)
    avg_dd = sum(r['max_dd'] for r in all_results) / len(all_results) if all_results else 0
    
    print(f"Total Trades: {total_trades}")
    print(f"Total W/L: {total_wins}/{total_losses}")
    print(f"Average Win Rate: {avg_winrate:.1f}%")
    print(f"Average P&L: ${avg_pnl:.2f}")
    print(f"Average Max DD: {avg_dd:.1f}%")
    
    if all_results:
        best = max(all_results, key=lambda x: x['pnl_pct'])
        worst = min(all_results, key=lambda x: x['pnl_pct'])
        print(f"\n🏆 Best: {best['symbol']} ({best['pnl_pct']:+.1f}%)")
        print(f"📉 Worst: {worst['symbol']} ({worst['pnl_pct']:.1f}%)")
    
    if avg_winrate >= 40 and avg_pnl > 0:
        print("\n✅ Strategy is PROFITABLE")
    else:
        print("\n⚠️ Strategy needs optimization")
    
    return all_results

if __name__ == "__main__":
    run_backtest()

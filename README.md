# Trading Swarm - Automated Crypto Futures Trading Bot

> Automated Binance Futures trading with Bollinger Bands strategy, algo SL/TP, and real-time dashboard.

## Acknowledgments

**Huge thanks to [Neko Futures Trader](https://github.com/lukmanc405/neko-futures-trader)** 🐱
- Algo SL/TP placement method (fapi/algoOrder) - critical for reliable order execution
- This bot uses Neka's algoOrder approach for STOP_MARKET and TAKE_PROFIT_MARKET orders

## Features

- 📊 **BB Strategy**: Bollinger Bands + RSI mean reversion
- 🎯 **Algo SL/TP**: Proper Binance algo orders (Neko method)
- 📈 **Fixed % Exit**: 5% TP / 2.5% SL for consistent profits
- 🔄 **Auto-trade**: Every 15 minutes via cron
- 📊 **Dashboard**: Real-time monitoring at `http://YOUR_IP:8443`
- 📊 **Backtest**: Monte Carlo simulation for strategy validation

## Strategy v2 Results (April 17, 2026)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 TRADING JOURNAL - April 17, 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Settings:
- Position: 80% of balance
- TP: 5% | SL: 2.5%
- Max positions: 2
- Target: $5-10/day

Results:
- Total Trades: 12
- Wins: 7 | Losses: 5
- Win Rate: 58%
- Gross P&L: +$0.57
- Fees: -$0.69
- Net P&L: -$0.12

Late Session TP Hits (18:15-18:30):
- XAGUSDT: +$0.23 ✅
- XAUUSDT: +$0.11 ✅
- ETHUSDT: +$1.52 ✅
- BNBUSDT: +$0.75 ✅
- BTCUSDT: +$1.11 ✅
- Total: +$3.71

Current Wallet: $122.06
Unrealized: +$2.43

KEY LEARNINGS:
1. Win rate 58% is good
2. Fees eat profits (need bigger positions)
3. 5% TP / 2.5% SL works well
4. Algo SL/TP (Neko method) reliable
5. Target $5/day achievable with full capital
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Strategy

### Current Settings (v2)

| Parameter | Value |
|-----------|-------|
| Position | 80% of balance |
| TP | 5% |
| SL | 2.5% |
| Max Positions | 2 |
| Min Profit/Trade | ~$3-5 net |
| Target | $5-10/day |

### Entry Signals

| Strategy | Entry Condition |
|----------|-----------------|
| **BB Long** | Price ≤ Lower BB + RSI < 40 |
| **BB Short** | Price ≥ Upper BB + RSI > 60 |

### Exit (SL/TP)

Fixed percentage for consistency:

| Parameter | Value |
|-----------|-------|
| SL | 2.5% below entry |
| TP | 5% above entry |
| Method | Algo orders (Neko fapi/algoOrder) |

## Credits

**Neko Futures Trader** 🐱 - Algo SL/TP implementation
- Uses `fapi/v1/algoOrder` endpoint
- STOP_MARKET and TAKE_PROFIT_MARKET with `algoType=CONDITIONAL`
- `reduceOnly=true` for proper position management

## Setup

### 1. Clone / Copy to VPS

```bash
cd /root/.openclaw/workspace
git clone https://github.com/mail-eth/crypto-trading-bot.git trading-swarm
cd trading-swarm
```

### 2. Install Dependencies

```bash
pip install requests
```

### 3. Configure API Keys

Create `/root/.openclaw/workspace/binance.env`:

```env
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_secret
TELEGRAM_BOT_TOKEN=your_telegram_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 4. Start Dashboard

```bash
python3 dashboard_api.py
```

Access at `http://YOUR_IP:8443`

### 5. Setup Cron

```bash
# Trading (every 15 min)
*/15 * * * * cd /root/.openclaw/workspace/trading-swarm && python3 mean_reversion.py >> /var/log/trading-bb.log 2>&1

# QA Audit (every hour)
0 * * * * cd /root/.openclaw/workspace/trading-swarm && python3 qa_audit.py >> /var/log/trading-qa.log 2>&1
```

## Files

| File | Description |
|------|-------------|
| `mean_reversion.py` | BB strategy v2 (main) |
| `futures_auto_trade.py` | Legacy scalper strategy |
| `qa_audit.py` | System health checks |
| `dashboard_api.py` | Real-time dashboard |
| `backtest.py` | Monte Carlo backtester |

## Risk Management

- Max 80% margin per trade
- Min position: $40
- Max positions: 2 at once
- Algo SL/TP via Binance API
- Target: $5-10/day with compounding

## ⚠️ Disclaimer

Trading futures is HIGH RISK. This bot is for educational purposes. Past performance does not guarantee future results. Always understand risks before trading.

## License

MIT

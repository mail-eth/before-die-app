---
name: crypto-trading-bot
description: Automated Binance Futures trading bot with Bollinger Bands + ATR strategy, dual-strategy support, and Monte Carlo backtesting.
---

# Crypto Trading Bot 🐱📈

Automated Binance Futures trading with advanced ATR-based risk management.

## Features

- 📊 **Dual Strategy**: BB Mean Reversion + RSI Scalper
- 🎯 **ATR-based SL/TP**: Dynamic stops based on market volatility (1:4 R:R)
- 🔍 **Multi-signal**: RSI, MACD, EMA extension, VCS filters
- 📈 **Monte Carlo Backtest**: Statistical strategy validation
- 📉 **QA Audit**: Hourly system health checks
- 📊 **Dashboard**: Real-time monitoring at `http://YOUR_IP:8443`

## Quick Start

```bash
cd /root/.openclaw/workspace/trading-swarm/crypto-trading-bot

# Install dependencies
pip install requests

# Configure (create binance.env)
cp .env.example .env
# Edit .env with your API keys

# Run
python3 mean_reversion.py
```

## ATR-based SL/TP

Dynamic risk management with 1:4 risk-reward ratio:

| Condition | SL | TP |
|-----------|----|----|
| ATR ≥ 10% (High) | 2x ATR | 8x ATR |
| ATR < 10% (Normal) | 2x ATR | 8x ATR |
| Fallback | 0.5% | 2.0% |

## Files

| File | Description |
|------|-------------|
| `mean_reversion.py` | Main strategy (BB + ATR) |
| `futures_auto_trade.py` | Scalper strategy |
| `qa_audit.py` | System health checks |
| `dashboard_api.py` | Real-time dashboard |
| `backtest.py` | Monte Carlo backtester |

## Cron Setup

```bash
# Trading (every 15 min)
*/15 * * * * cd /root/.openclaw/workspace/trading-swarm/crypto-trading-bot && bash run_cycle.sh >> /var/log/trading.log 2>&1

# QA Audit (every hour)
0 * * * * cd /root/.openclaw/workspace/trading-swarm/crypto-trading-bot && bash run_qa.sh >> /var/log/qa.log 2>&1
```

## Dashboard

```bash
python3 dashboard_api.py
# Access: http://YOUR_IP:8443
```

## Risk Management

- Max 20% margin per trade
- Min position: $20 | Max: $50
- SL: ATR-based or 0.5%
- TP: ATR-based or 2.0%
- Max 5 open positions

## GitHub

https://github.com/mail-eth/crypto-trading-bot

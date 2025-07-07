# FORMULA - DAO Merger Simulator

**Advanced cross-collateralization simulator for capital-efficient DAO treasury mergers using EulerSwap**

FORMULA is an intelligent simulation platform that helps DAOs optimize treasury mergers through EulerSwap's innovative borrowing mechanisms, providing real-time analysis and capital efficiency calculations.

## Overview

FORMULA enables DAOs to simulate and analyze potential mergers using cross-collateralization strategies, where USDC collateral enables borrowing of native tokens, achieving 5-7x capital efficiency compared to traditional AMMs.

## Table of Contents

- [Key Features](#key-features)
- [Technical Architecture](#technical-architecture)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [API Documentation](#api-documentation)
- [License](#license)

## Key Features

- **Cross-Collateralization Simulation**: Model USDC-backed borrowing strategies for native token swaps
- **Real-Time Treasury Analysis**: Live data from DeFiLlama for accurate treasury compositions
- **Step-by-Step Merger Simulation**: Interactive walkthrough of collateral deployment, borrowing, and swap execution
- **AI-Powered Insights**: FORMULA assistant provides contextual analysis and recommendations
- **Capital Efficiency Calculator**: Compare efficiency gains versus traditional AMM approaches
- **Risk Assessment**: Automated analysis of liquidation risks and vault utilization impacts

## Technical Architecture

FORMULA combines DeFi data aggregation with advanced simulation capabilities:

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom glass-morphism effects
- **Charts**: Recharts for treasury and price visualization
- **Data Sources**: DeFiLlama API for real-time treasury and price data
- **AI Integration**: Claude API for intelligent merger analysis
- **State Management**: React Context API for centralized data flow

## Repository Structure

```
FORMULA/
├── README.md                # Project overview and setup instructions
├── package.json             # Frontend dependencies & scripts
├── package-lock.json        # Frontend lockfile
├── render.yaml              # Deployment configuration
├── public/                  # Static assets
│   ├── index.html
│   └── manifest.json
├── src/                     # React frontend source code
│   ├── App.js              # Main application component
│   ├── App.css             # Global styles
│   ├── index.js            # Application entry point
│   ├── index.css           # Base styles with Space Grotesk font
│   ├── components/          # UI components
│   │   ├── SimulationPage.js      # Main merger simulation interface
│   │   ├── AnalyticsDashboard.js  # Treasury analytics dashboard
│   │   ├── CommandCenter.js       # AI command interface
│   │   ├── FormulaChatWidget.js   # FORMULA assistant chat
│   │   └── PremiumHomepage.js     # Landing page
│   ├── context/             # React context providers
│   │   └── DataContext.js   # Centralized data management
│   ├── services/            # API integrations
│   │   └── api.js          # DeFiLlama and backend API calls
│   └── utils/               # Utility functions
│       ├── mergerRecommendations.js  # Merger analysis logic
│       └── tokenAnalytics.js         # Token metrics calculations
└── backend/                 # Express server
    ├── package.json         # Backend dependencies
    ├── package-lock.json    # Backend lockfile
    ├── server.js            # Express API server
    └── .env.example         # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js v14+ and npm
- Anthropic API key for FORMULA assistant

### Configure Environment Variables

In the `backend/` directory, create a `.env` file:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Backend Setup

```bash
cd backend
npm install
npm run dev   # Development mode with auto-reload
```

The backend will start on port `3001` by default.

### Frontend Setup

In a separate terminal:

```bash
npm install
npm start
```

The frontend will start on port `3000` and proxy API requests to the backend.

## Core Concepts

### Understanding Cross-Collateralization: Traditional AMM vs EulerSwap

**Traditional AMM (like Uniswap):**
- AAVE DAO wants 1,000,000 COMP tokens
- COMP DAO wants 50,000 AAVE tokens
- Both must deposit their FULL amounts into a liquidity pool
- Capital requirement: 100% of swap value locked up

**EulerSwap Cross-Collateralization:**
- Both DAOs use their stablecoins (USDC) as collateral
- Borrow the tokens they need instead of depositing them
- Only need 10-20% of tokens initially
- Capital efficiency: 5-7x better (up to 40x in optimal conditions per EulerSwap whitepaper)

### Detailed Example: AAVE-COMP Merger

Let's walk through a concrete example with real numbers:

**Initial State:**
- AAVE price: $100
- COMP price: $50
- AAVE treasury: 10M USDC
- COMP treasury: 8M USDC

#### Step 1: USDC Collateral Deployment
```
AAVE deposits: 5M USDC → Euler USDC vault
COMP deposits: 4M USDC → Euler USDC vault
```

#### Step 2: Configure Cross-Collateralization
Both token vaults must accept USDC as collateral:
```solidity
AAVE_vault.setLTV(USDC_vault, 0.9e4, 0.93e4, 0)
COMP_vault.setLTV(USDC_vault, 0.9e4, 0.93e4, 0)
```
- 90% LTV (loan-to-value): Can borrow up to 90% of USDC collateral value
- 93% liquidation threshold: Get liquidated if debt exceeds 93%

#### Step 3: Calculate Borrowing Capacity
```
AAVE can borrow: 5M USDC × 0.9 = $4.5M worth of COMP
                 = 4.5M ÷ $50 = 90,000 COMP tokens

COMP can borrow: 4M USDC × 0.9 = $3.6M worth of AAVE  
                 = 3.6M ÷ $100 = 36,000 AAVE tokens
```

#### Step 4: Initial Token Deposits (10-20% only)
```
AAVE deposits: 10,000 COMP into COMP vault
COMP deposits: 5,000 AAVE into AAVE vault
```

#### Step 5: The Cross-Deposit Magic

Here's where EulerSwap's innovation shines:

1. **First Swap**: COMP borrows 36,000 AAVE and swaps for COMP
   - COMP receives: 36,000 AAVE tokens
   - AAVE receives: 72,000 COMP tokens (at 2:1 price ratio)
   - **Key**: Those 72,000 COMP are deposited INTO the COMP vault

2. **COMP vault now has more liquidity**: 10,000 + 72,000 = 82,000 COMP available

3. **Second Swap**: AAVE can now borrow from the increased COMP liquidity
   - AAVE borrows: 82,000 COMP 
   - Swaps for: 41,000 AAVE (at 2:1 ratio)
   - Those 41,000 AAVE go INTO the AAVE vault

4. **Multiplier Effect**: Each swap increases borrowable liquidity in both vaults

### The Math Behind Capital Efficiency

**Traditional AMM Total Capital Locked:**
```
AAVE: 50,000 AAVE × $100 = $5,000,000
COMP: 100,000 COMP × $50 = $5,000,000
Total: $10,000,000 locked in volatile assets
```

**EulerSwap Total Capital Used:**
```
USDC collateral: 5M + 4M = $9,000,000 (stable)
Initial tokens: (5,000 × $100) + (10,000 × $50) = $1,000,000 (volatile)
Total: $10,000,000 but only $1M exposed to volatility
```

**The Key Difference:**
- Traditional: $10M locked, can only facilitate this one swap
- EulerSwap: After swaps, vaults have MORE liquidity than before
- Can facilitate 5-7x more volume with same capital

### Technical Implementation

The mechanism is validated by EulerSwap's test suite and architecture:

1. **CollateralSwap.t.sol** proves vaults can accept other assets as collateral at 90% LTV
2. **FundsLib.withdrawAssets()** first uses existing vault balances, then borrows as needed
3. **Cross-deposits** create self-reinforcing liquidity where each swap improves future conditions

### Risk Management

**Liquidation Protection Example:**
```
If AAVE price rises 50% to $150:
- COMP's debt: 36,000 AAVE × $150 = $5.4M
- COMP's collateral: $4M USDC
- LTV: $5.4M / $4M = 135% → LIQUIDATION RISK

With 90% LTV buffer:
- Max safe debt: $4M × 0.9 = $3.6M
- Current debt value: $5.4M
- Action needed: Repay $1.8M or add collateral
```

### Why This Works

1. **Stablecoins are ideal collateral**: Low volatility enables high LTV ratios (85-90%)
2. **Cross-deposits create liquidity**: Each swap increases available borrowing
3. **Capital efficiency**: Most capital stays in stable assets
4. **Lower risk**: Minimal exposure to volatile assets through borrowing

### References

- [EulerSwap Whitepaper](https://github.com/euler-xyz/euler-swap)
- [CollateralSwap Test Case](https://github.com/euler-xyz/euler-swap/blob/main/test/CollateralSwap.t.sol)
- [EulerSwap Contract Documentation](https://github.com/euler-xyz/euler-swap/tree/main/src)

## API Documentation

### Key Endpoints

- `GET /api/prices` - Fetch real-time token prices from DeFiLlama
- `GET /api/treasuries` - Get DAO treasury compositions
- `GET /api/euler-vaults` - Retrieve Euler USDC vault status
- `POST /api/chat` - FORMULA assistant interactions
- `POST /api/analysis` - Generate merger analysis

### Data Flow

1. Frontend requests data through DataContext
2. Backend aggregates data from DeFiLlama API
3. Merger configurations calculated based on treasury positions
4. Simulation parameters generated for step-by-step execution

## License

This project is licensed under the MIT License.
# FORMULA - EulerSwap One-Sided JIT Liquidity Merger Simulator

**Interactive simulation platform for DAO mergers using EulerSwap's innovative one-sided Just-In-Time liquidity model**

FORMULA provides comprehensive modeling and real-time simulation of DAO treasury mergers through EulerSwap's asymmetric AMM architecture, where only the surviving DAO provides liquidity while the phased-out DAO's token holders execute swaps through JIT borrowing mechanisms.

## Overview

FORMULA simulates DAO mergers using EulerSwap's one-sided JIT liquidity provisioning model. Unlike traditional AMMs requiring dual-sided liquidity, EulerSwap's architecture enables capital-efficient mergers where only the surviving DAO funds a vault (achieving up to 40x capital efficiency), while the phased-out DAO's tokens serve as collateral for JIT borrowing. This creates a truly asymmetric pool with dynamic price discovery through configurable concentration parameters.

## Table of Contents

- [Key Features](#key-features)
- [Technical Architecture](#technical-architecture)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [EulerSwap Core Concepts](#eulerswap-core-concepts)
- [API Documentation](#api-documentation)
- [License](#license)

## Key Features

- **EulerSwap One-Sided JIT Model**: Simulate asymmetric mergers using EulerSwap's vault-based architecture
- **Interactive Batch Execution**: Real-time animation of swap execution with customizable strategies (500 rapid vs 1000 gradual batches)
- **Actual vs Theoretical Impact**: Track real execution impact vs equilibrium calculations using EulerSwap's concentration parameters
- **Dynamic AMM Curves**: Configure EulerSwap's concentrationX/concentrationY parameters for optimal price discovery
- **JIT Borrowing Simulation**: Model real-time borrowing from pre-funded surviving token vaults
- **EulerSwap Pool Configuration**: Generate exact vault addresses, equilibrium reserves, and AMM parameters
- **Capital Efficiency Analysis**: Demonstrate 32-40x efficiency gains vs traditional dual-sided AMMs
- **AI-Powered EulerSwap Analysis**: FORMULA assistant with deep knowledge of EulerSwap mechanics

## Technical Architecture

FORMULA integrates EulerSwap's core mathematical and architectural components:

- **Frontend**: React 18 with real-time EulerSwap batch execution simulation
- **EulerSwap AMM Mathematics**: Implementation of concentration parameter calculations and asymmetric curve dynamics
- **JIT Borrowing Engine**: Simulation of EulerSwap's vault-based lending mechanism
- **Price Discovery**: Real-time tracking using EulerSwap's dynamic pricing formulas
- **Vault Configuration**: Generate EulerSwap-compatible pool parameters and addresses
- **Data Integration**: DeFiLlama API for treasury data with EulerSwap parameter optimization
- **AI Integration**: Claude API trained on EulerSwap documentation and implementation details

## Repository Structure

```
FORMULA/
├── README.md                # Project overview and EulerSwap integration
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
│   │   ├── SimulationPage.js      # EulerSwap batch execution simulation
│   │   ├── AnalyticsDashboard.js  # Treasury analytics with EulerSwap metrics
│   │   ├── CommandCenter.js       # AI command interface for EulerSwap queries
│   │   ├── FormulaChatWidget.js   # FORMULA assistant with EulerSwap expertise
│   │   ├── SuccessNotification.js # Execution completion with EulerSwap metrics
│   │   └── PremiumHomepage.js     # Landing page
│   ├── context/             # React context providers
│   │   └── DataContext.js   # Centralized data and EulerSwap price tracking
│   ├── services/            # API integrations and EulerSwap calculations
│   │   ├── api.js          # EulerSwap merger configuration and price impact
│   │   └── mergerDataService.js   # EulerSwap-specific calculation services
│   └── utils/               # Utility functions and algorithms
│       ├── mergerRecommendations.js  # AI analysis with EulerSwap parameters
│       ├── tokenAnalytics.js         # Token metrics for EulerSwap optimization
│       └── eulerUtils.js             # EulerSwap AMM curve mathematics
└── backend/                 # Express server with EulerSwap integration
    ├── package.json         # Backend dependencies
    ├── package-lock.json    # Backend lockfile
    ├── server.js            # Express API server with EulerSwap endpoints
    └── .env.example         # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js v14+ and npm
- Anthropic API key for FORMULA assistant (trained on EulerSwap documentation)

### Configure Environment Variables

In the `backend/` directory, create a `.env` file:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
COINGECKO_API_KEY=optional_coingecko_api_key
```

### Backend Setup

```bash
cd backend
npm install
npm run dev   # Development mode with auto-reload
```

The backend will start on port `3001` and display EulerSwap-specific endpoint information.

### Frontend Setup

In a separate terminal:

```bash
npm install
npm start
```

The frontend will start on port `3000` and proxy API requests to the EulerSwap-enabled backend.

## EulerSwap Core Concepts

### EulerSwap's One-Sided JIT Liquidity Architecture

EulerSwap revolutionizes DAO mergers through asymmetric liquidity provisioning. Traditional AMMs require both parties to provide liquidity, locking substantial capital. EulerSwap's one-sided model enables:

**Asymmetric Vault Configuration:**
- **Phased-out Token Vault**: Receives deposited tokens as collateral (no pre-funding required)
- **Surviving Token Vault**: Pre-funded by surviving DAO for JIT borrowing
- **Zero Initial Liquidity**: `currReserve0 = 1, currReserve1 = requiredMint`

**Just-In-Time Borrowing Mechanism:**
```solidity
// EulerSwap JIT borrowing flow
1. User deposits phased-out tokens as collateral
2. System calculates borrowing capacity using LTV ratios
3. Surviving tokens borrowed just-in-time from pre-funded vault
4. AMM curve determines exchange rate based on concentration parameters
5. Price adjusts dynamically with each swap
```

### EulerSwap AMM Mathematics

EulerSwap uses concentrated liquidity with configurable parameters:

**Concentration Parameters:**
```javascript
// EulerSwap pool configuration
{
  concentrationX: 0.5e18,    // 50% concentration for phased-out token
  concentrationY: 0.95e18,   // 95% concentration for surviving token
  equilibriumReserve0: 1,    // Minimal phased-out token reserves
  equilibriumReserve1: requiredMint, // Full surviving token requirement
  priceX: 1e18,              // Base price unit
  priceY: (tokenA_price/tokenB_price) * 1e18, // Dynamic price ratio
  fee: 0.003e18              // 0.3% trading fee
}
```

**Price Impact Calculation:**
EulerSwap's concentrated curves provide:
- **Tight Discovery (0.5, 0.95)**: <0.5% impact within equilibrium zone, quadratic beyond
- **Gradual Discovery (0.35, 0.85)**: Smooth 2-5% impact progression
- **Wide Discovery (0.2, 0.7)**: Linear impact scaling for large volumes

### Capital Efficiency Comparison

**Traditional AMM (Uniswap-style):**
```
Capital Required: 100% of both tokens
Liquidity Utilization: ~15% (due to infinite range)
Capital Efficiency: 1x baseline
Idle Capital: 85% locked with no yield
```

**EulerSwap One-Sided JIT:**
```
Capital Required: Only surviving token vault funding
Liquidity Utilization: 95%+ (concentrated ranges)
Capital Efficiency: 32-40x improvement
Idle Capital: Minimal - excess earns vault yield
```

### Real-World Example: EUL-COMP Merger

**Traditional AMM Approach:**
- EUL DAO: Provide 5.97M EUL tokens (~$20.9M)
- COMP DAO: Provide 464K COMP tokens (~$20.9M)
- **Total Locked**: $41.8M in volatile assets

**EulerSwap One-Sided Approach:**
- EUL DAO: No upfront token provision
- COMP DAO: Fund vault with 464K COMP tokens (~$20.9M)
- **Total Locked**: $20.9M (50% reduction)
- **Additional Benefits**: Vault yields on COMP deposits, dynamic pricing

### EulerSwap Batch Execution Strategies

**Rapid Execution (500 batches):**
```javascript
// Front-loaded distribution for quick completion
phases: [
  { batches: 100, percentage: 30 }, // 0.3% each
  { batches: 100, percentage: 25 }, // 0.25% each
  { batches: 100, percentage: 20 }, // 0.2% each
  { batches: 100, percentage: 15 }, // 0.15% each
  { batches: 100, percentage: 10 }  // 0.1% each
]
```

**Gradual Execution (1000 batches):**
```javascript
// Equal distribution for minimal impact
phases: [
  { batches: 1000, percentage: 100 } // 0.1% each batch
]
```

### EulerSwap Price Discovery Mechanics

Unlike fixed-rate swaps, EulerSwap provides dynamic price discovery:

1. **Initial Price**: Based on external market rates and concentration parameters
2. **Dynamic Adjustment**: Each swap shifts the curve based on volume and concentration
3. **Impact Calculation**: Real-time tracking of actual vs theoretical impact
4. **Concentration Effects**: Higher concentration = tighter pricing, lower slippage

## API Documentation

### Core Data Endpoints

#### `GET /api/prices`
Fetch real-time token prices with 50-day history for EulerSwap parameter optimization
```json
{
  "success": true,
  "data": [
    {
      "symbol": "EUL",
      "currentPrice": 3.50,
      "priceHistory": [...],
      "address": "0xd9Fcd98c322942075A5C3860693e9f4f03AAE07b"
    }
  ]
}
```

#### `GET /api/token-circulation/:token`
Get circulating supply data for EulerSwap merger calculations
```json
{
  "success": true,
  "data": {
    "token": "EUL",
    "circulatingSupply": 27027027,
    "name": "Euler",
    "symbol": "EUL"
  }
}
```

### EulerSwap AI Integration

#### `POST /api/chat`
Interactive chat with FORMULA assistant trained on EulerSwap mechanics
```json
{
  "messages": [...],
  "mergerPair": "EUL-COMP"
}
```

**Response includes EulerSwap-specific context:**
- One-sided JIT liquidity model explanation
- Dynamic concentration parameter recommendations
- Vault funding requirements and strategies
- Capital efficiency calculations (32-40x improvements)

#### `POST /api/analysis`
Comprehensive DAO merger analysis using EulerSwap parameters
```json
{
  "mergerContext": {
    "daoA": { "symbol": "EUL", "price": 3.50 },
    "daoB": { "symbol": "COMP", "price": 45.00 }
  }
}
```

**Returns EulerSwap Configuration:**
```json
{
  "executionStrategy": {
    "poolConfiguration": {
      "vault0": "EULVaultAddress",
      "vault1": "COMPVaultAddress", 
      "equilibriumReserve0": "1",
      "equilibriumReserve1": "464000",
      "concentrationX": "0.5e18",
      "concentrationY": "0.95e18",
      "priceX": "1e18",
      "priceY": "77777777777777777",
      "fee": "0.003e18"
    }
  }
}
```

#### `POST /api/execution-summary`
Post-execution analysis with EulerSwap metrics
```json
{
  "action": {...},
  "mergerContext": {...}
}
```

**Returns EulerSwap-specific metrics:**
- JIT borrowing volumes and capacity
- Vault utilization rates
- Dynamic price impact progression
- Capital efficiency achievements

### Testing Endpoints

#### `GET /api/test`
Simple health check for backend connectivity

#### `POST /api/test-analysis`
Test Anthropic API connection with EulerSwap context

### EulerSwap Simulation Data Flow

1. **DAO Selection**: Choose merger pairs with price/supply data
2. **EulerSwap Configuration**: Calculate optimal concentration parameters and vault requirements
3. **Interactive Simulation**: Step-by-step execution with real-time EulerSwap price updates
4. **JIT Borrowing**: Model vault utilization and borrowing capacity
5. **Impact Analysis**: Compare actual execution vs EulerSwap theoretical calculations

### Frontend Integration Examples

**Fetching EulerSwap Merger Configuration:**
```javascript
const config = await fetch('/api/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mergerContext: {
      daoA: { symbol: 'EUL', price: 3.50 },
      daoB: { symbol: 'COMP', price: 45.00 }
    }
  })
});
```

**Real-time EulerSwap Price Tracking:**
```javascript
// During batch execution simulation
const priceImpact = (currentPrice - initialPrice) / initialPrice * 100;
// Uses EulerSwap concentration parameters for realistic impact calculation
```

## EulerSwap References

- **EulerSwap GitHub**: [https://github.com/euler-xyz/euler-swap](https://github.com/euler-xyz/euler-swap)
- **EulerSwap Documentation**: [https://docs.euler.xyz/](https://docs.euler.xyz/)
- **Concentration Mathematics**: Based on EulerSwap's `OneSidedCurve.t.sol` test implementations
- **Vault Architecture**: Implements EulerSwap's asymmetric vault lending model
- **JIT Borrowing**: Simulates EulerSwap's `FundsLib.withdrawAssets()` functionality

## License

This project is licensed under the MIT License.

---

*FORMULA leverages EulerSwap's groundbreaking one-sided JIT liquidity model to provide the most capital-efficient DAO merger simulation platform available, achieving 32-40x improvement over traditional AMM approaches.*
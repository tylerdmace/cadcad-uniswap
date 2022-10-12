# Uniswap Model
> "Uniswap is an automated market maker for exchanging ERC20 tokens. Anyone can become a liquidity provider and invest in the liquidity pool of an ERC20 token. This allows other users to trade that token for other tokens at an exchange rate based on their relative availibility. When a token trade is executed, a small fee is paid to the liquidity providers that enabled the transaction."

## Model Overview
### Limitations
This model is based on the work of several Uniswap models created over the last few years. Agent behavior is not simulated and as such this model will not provide insights on agent reactions to pool state or changes in policy.

### config.py
```python
---8<--- "model/config.py"
```

### psubs.py
```python
---8<--- "model/psubs.py"
```

### state.py
```python
--->8--- "model/state.py"
```

### updates.py
```python
--->8--- "model/updates.py"
```
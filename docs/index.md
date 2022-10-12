## Overview
> "Uniswap is an automated market maker for exchanging ERC20 tokens. Anyone can become a liquidity provider and invest in the liquidity pool of an ERC20 token. This allows other users to trade that token for other tokens at an exchange rate based on their relative availibility. When a token trade is executed, a small fee is paid to the liquidity providers that enabled the transaction."

## Limitations & Constraints
This model is based on the work of several Uniswap models created over the last few years by [BlockScience](https://block.science) data scientists. Agent behavior is not simulated and as such this model will not provide insights on agent reactions to pool state or changes in policy.

## Implementation
- [Genesis State](state.md)
- [Parameters](params.md)
- [Policies & State Update Functions](updates.md)
- [Configuration](config.md)

## Analysis
<div id="analysis">
    <div id="controls">
        <div>
            <span>River Selection:</span>
            <br />
            <input id="river-selection-blue" name="river-selection" value="blue" type="radio" class="radio">
            <label for="river-selection-blue">Blue Nile</label>
            <br />
            <input id="river-selection-white" name="river-selection" value="white" type="radio" class="radio">
            <label for="river-selection-white">White Nile</label>
            <br />
            <input id="river-selection-atbara" name="river-selection" value="atbara" type="radio" class="radio">
            <label for="river-selection-atbara">Atbara</label>
            <br />
            <input id="river-selection-all" name="river-selection" value="all" type="radio" class="radio">
            <label for="river-selection-all">All Rivers</label>
        </div>
        <div>
            <label for="reserve-selection">Reserve Percentage (current: <span id="reserve-selection-details"></span>):</label>
            <input id="reserve-selection" type="range" min="0" max="100" step="10" class="slider">
            <br />
            <br />
            <div>
                <input type="button" id="run-simulation" class="button" value="Run Simulation">
            </div>
        </div>
    </div>
    <div id="spacer"></div>
    <div id="plots">
        <div id="river-flow-rate"></div>
        <div id="reservoir-level"></div>
    </div>
</div>
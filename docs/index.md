## Overview
> "Uniswap is an automated market maker for exchanging ERC20 tokens. Anyone can become a liquidity provider and invest in the liquidity pool of an ERC20 token. This allows other users to trade that token for other tokens at an exchange rate based on their relative availibility. When a token trade is executed, a small fee is paid to the liquidity providers that enabled the transaction."

## Limitations & Constraints
This model is based on the work of several Uniswap models created over the last few years by [BlockScience](https://block.science) data scientists. Agent behavior is not simulated and as such this model will not provide insights on agent reactions to pool state or changes in policy.

## Implementation Details
This is a section where we can examine specific implementation details in greater detail and talk about both the *why* and *how*.

### Initial State
```python
---8<--- "model/state.py"
```

### Parameters
```python
---8<--- "model/params.py"
```

### Policies & State Update Functions
See implementation details [here](updates.md).

### Configuration
```python
---8<--- "model/config.py"
```

## Analysis
<div id="analysis">
    <div id="controls">
        <div>
            <span>Currency Selection:</span>
            <br />
            <input id="river-selection-blue" name="river-selection" value="blue" type="radio" class="radio">
            <label for="river-selection-blue">Ethereum (ETH)</label>
            <br />
            <input id="river-selection-white" name="river-selection" value="white" type="radio" class="radio">
            <label for="river-selection-white">Dai (DAI)</label>
            <br />
            <input id="river-selection-atbara" name="river-selection" value="atbara" type="radio" class="radio">
            <label for="river-selection-atbara">Uniswap (UNI)</label>
            <br />
            <input id="river-selection-all" name="river-selection" value="all" type="radio" class="radio">
            <label for="river-selection-all">All</label>
        </div>
        <div>
            <label for="reserve-selection">Fee Percentage (current: <span id="reserve-selection-details"></span>):</label>
            <input id="reserve-selection" type="range" min="0" max="100" step="10" class="slider">
            <br />
            <br />
            <div>
                <input type="button" id="run-simulation" class="button" value="Update Analysis">
            </div>
        </div>
    </div>
    <div id="spacer"></div>
    <div class="plots">
        <div id="ridgeline"></div>
    </div>
    <p>As expected, higher retail tolerance values lead to higher returns for higher fee values, since more retail trades will be allowed. Similarly, lower retail precision values lead to higher returns, as more trades are considered arbitrage and the behavior of this agent causes the pool to always be brought to the <i>ideal</i> state. However, it's noticeable that this increase is more significant for lower retail tolerance values.</p>
    <p>Another important note is that higher fee values don't necessarily result in higher returns, as shown by the plot in the second column of the first row. This happens because, with low retail tolerance and a high number of retail trades, less of these trades are considered profitable. Therefore, we can conclude that, given the right system conditions, <strong>higher fees can make Uniswap less attractive to liquidity providers</strong>.</p>
    <p>Finally, it's important to state that retail_tolerance and retail_precision are both <strong>arbitrary parameters</strong> over which there is <strong>no control in a real system</strong>, created to possibilitate the development of the agents' behaviors and the trade classification mechanism and, as shown above, to allow hypotheses validation through parameter sweeping.</p>
    <div class="plots">
        <div id="river-flow-rate"></div>
        <div id="reservoir-level"></div>
    </div>
    <p>This script returns a dataframe containing the historic return of three different strategies: <strong>50/50 hodler</strong>, <strong>ETH hodler</strong> and <strong>UNI hodler</strong> (liquidity provider). With these data, it is possible to use cadCAD's parameter sweeping feature to validate hypotheses according to possible scenarios for Uniswap. The parameters swept are described below:</p>
    <p>
        <ul>
            <li><strong>retail_precision</strong>: This model assumes two classes of users: arbitrageurs and retail traders. Swaps observed in the historical data will be replayed against the model or not depending on the state of the model and individual policies implemented for each one of the user classes. Therefore, swaps must be classified as originating from one of the two classes of users. We apply a simple heuristic based on the precision of the values involved in the trade. If either the precision of the input or the output of a swap are less than or equal to <em>retail_precision</em>, the swap is classified as a retail trade. For example, let's consider a swap with an eth_delta of <em>-0.005542280351005221</em> (precision 18) and a token_delta of <em>1.529800000000000000</em> (precision 4).
                <ul style="list-style: none">
                    <li>&nbsp;&nbsp;&nbsp;&nbsp;<em>*</em> If <em>retail_precision &gt;= 4</em>, then this swap would be classified as a retail trade</li>
                    <li>&nbsp;&nbsp;&nbsp;&nbsp;<em>*</em> If <em>retail_precision &lt; 4</em>, then this swap would be classified as an arbitrage - in other words, we assume this swap is too precise for it to be plausible it would have been executed by a retail trader on the Uniswap UI, and therefore must have originated from an arbitrageur</li>
                </ul>
            </li>
             <li><strong>retail_tolerance</strong>: In order for swaps observed in the historical data that are classified as retail trades to be replayed against the model, the effective price paid by the simulated agent must not be higher than the price observed in the historical data, factored by the <em>retail_tolerance</em> parameter. In other words, this determines the retail trader's tolerance (in %) to receive less money from an exchange made. For example, if in a certain exchange in Uniswap's real history <strong>1 ETH</strong> was sold for <strong>250 DAI</strong> and retail_tolerance is set at <strong>0.05</strong>, the model will replay the trade (sell 1 ETH) if given the state of the model the trader receives <strong>237.5 DAI or more</strong> for it. Otherwise, the trade will be disregarded in the simulation.</li>
        </ul>
    </p>
    <p>Now, let's plot the calculated returns to analyze the sensitivity of the model to the parameters. The following script shows the plots dynamically as the number of parameters changes. The simulation made used two fee (<strong>0.3%</strong> and <strong>0.5%</strong>), two retail_tolerance (<strong>0.05%</strong> and <strong>2.5%</strong>) and two retail_precision (<strong>3</strong> and <strong>15</strong>) values.</p>
    <div class="plots">
        <div id="donut"></div>
        <div id="scatter-plot"></div>
    </div>
</div>
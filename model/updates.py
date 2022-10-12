# Policies

def p_actionDecoder(_params, substep, sH, s):
    uniswap_events = _params['uniswap_events']
    
    prev_timestep = s['timestep']
    if substep > 1:
        prev_timestep -= 1
        
    #skip the first two events, as they are already accounted for in the initial conditions of the system
    t = prev_timestep + 2 
    
    action = {
        'eth_sold': 0,
        'tokens_sold': 0,
        'eth_deposit': 0,
        'UNI_burn': 0, 
        'UNI_pct': 0,
        'fee': 0,
        'conv_tol': 0,
        'price_ratio': 0
    }

    #Event variables
    event = uniswap_events['event'][t]
    action['action_id'] = event

    if event in ['TokenPurchase', 'EthPurchase']:
        I_t, O_t, I_t1, O_t1, delta_I, delta_O, action_key = get_parameters(uniswap_events, event, s, t)
        if _params['retail_precision'] == -1:
            action[action_key] = delta_I
        elif classifier(delta_I, delta_O, _params['retail_precision']) == "Conv":            #Convenience trader case
            calculated_delta_O = int(get_output_amount(delta_I, I_t, O_t, _params))
            if calculated_delta_O >= delta_O * (1-_params['retail_tolerance']):
                action[action_key] = delta_I
            else:
                action[action_key] = 0
            action['price_ratio'] =  delta_O / calculated_delta_O
        else:            #Arbitrary trader case
            P = I_t1 / O_t1
            actual_P = I_t / O_t
            if(actual_P > P):
                I_t, O_t, I_t1, O_t1, delta_I, delta_O, action_key = get_parameters(uniswap_events, reverse_event(event), s, t)
                P = I_t1 / O_t1
                actual_P = I_t / O_t
                delta_I = get_delta_I(P, I_t, O_t, _params)
                delta_O = get_output_amount(delta_I, I_t, O_t, _params)
                if(unprofitable_transaction(I_t, O_t, delta_I, delta_O, action_key, _params)):
                    delta_I = 0
                action[action_key] = delta_I
            else:
                delta_I = get_delta_I(P, I_t, O_t, _params)
                delta_O = get_output_amount(delta_I, I_t, O_t, _params)
                if(unprofitable_transaction(I_t, O_t, delta_I, delta_O, action_key, _params)):
                    delta_I = 0
                action[action_key] = delta_I
    elif event == 'AddLiquidity':
        delta_I = uniswap_events['eth_delta'][t]
        action['eth_deposit'] = delta_I
    elif event == 'Transfer':
        UNI_delta = uniswap_events['uni_delta'][t]
        UNI_supply = uniswap_events['UNI_supply'][t-1]
        if UNI_delta < 0:
            action['UNI_burn'] = -UNI_delta
            action['UNI_pct'] = -UNI_delta / UNI_supply
    del uniswap_events
    return action
        
# State Update Functions

def s_mechanismHub_DAI(_params, substep, sH, s, _input):
    action = _input['action_id']
    if action == 'TokenPurchase':
        return ethToToken_DAI(_params, substep, sH, s, _input)
    elif action == 'EthPurchase':
        return tokenToEth_DAI(_params, substep, sH, s, _input)
    elif action == 'AddLiquidity':
        return addLiquidity_DAI(_params, substep, sH, s, _input)
    elif action == 'Transfer':
        return removeLiquidity_DAI(_params, substep, sH, s, _input)
    return('DAI_balance', s['DAI_balance'])
    
def s_mechanismHub_ETH(_params, substep, sH, s, _input):
    action = _input['action_id']
    if action == 'TokenPurchase':
        return ethToToken_ETH(_params, substep, sH, s, _input)
    elif action == 'EthPurchase':
        return tokenToEth_ETH(_params, substep, sH, s, _input)
    elif action == 'AddLiquidity':
        return addLiquidity_ETH(_params, substep, sH, s, _input)
    elif action == 'Transfer':
        return removeLiquidity_ETH(_params, substep, sH, s, _input)
    return('ETH_balance', s['ETH_balance'])

def s_mechanismHub_UNI(_params, substep, sH, s, _input):
    action = _input['action_id']
    if action == 'AddLiquidity':
        return addLiquidity_UNI(_params, substep, sH, s, _input)
    elif action == 'Transfer':
        return removeLiquidity_UNI(_params, substep, sH, s, _input)
    return('UNI_supply', s['UNI_supply'])

def s_price_ratio(_params, substep, sH, s, _input):
    return('price_ratio',_input['price_ratio'])

# Helpers

def profitable(P, delta_I, delta_O, action_key, _params):
    gross_profit = (delta_O*P) - delta_I
    if(action_key == 'token'):
        convert_to_ETH = gross_profit/P
        is_profitable = (convert_to_ETH > _params['fix_cost'])
    else:
        is_profitable = (gross_profit > _params['fix_cost'])

def get_parameters(uniswap_events, event, s, t):
    if(event == "TokenPurchase"):
        I_t = s['ETH_balance']
        O_t = s['DAI_balance']
        I_t1 = uniswap_events['eth_balance'][t]
        O_t1 = uniswap_events['token_balance'][t]
        delta_I = uniswap_events['eth_delta'][t]
        delta_O = abs(uniswap_events['token_delta'][t])
        action_key = 'eth_sold'
    else:
        I_t = s['DAI_balance']
        O_t = s['ETH_balance']
        I_t1 = uniswap_events['token_balance'][t]
        O_t1 = uniswap_events['eth_balance'][t]
        delta_I = uniswap_events['token_delta'][t]
        delta_O = abs(uniswap_events['eth_delta'][t])
        action_key = 'tokens_sold'
    
    return I_t, O_t, I_t1, O_t1, delta_I, delta_O, action_key

def reverse_event(event):
    if(event == "TokenPurchase"):
        new_event = 'EthPurchase'
    else:
        new_event = 'TokenPurchase'
    return new_event

def get_output_amount(delta_I, I_t, O_t, _params):
    fee_numerator = _params['fee_numerator']
    fee_denominator = _params['fee_denominator']
    delta_I_with_fee = delta_I * fee_numerator
    numerator = delta_I_with_fee * O_t                        
    denominator = (I_t * fee_denominator) + delta_I_with_fee 
    return int(numerator // denominator)                      

def get_input_amount(delta_O, I_t, O_t, _params):
    fee_numerator = _params['fee_numerator']
    fee_denominator = _params['fee_denominator']
    numerator = I_t * delta_O * fee_denominator
    denominator = (O_t - delta_O) * fee_numerator
    return int(numerator // denominator) + 1

def classifier(delta_I, delta_O, retail_precision):
    if (delta_I / (10 ** (18-retail_precision))).is_integer() or (delta_O / (10 ** (18-retail_precision))).is_integer() :
      return "Conv"
    else:
      return "Arb"

def get_delta_I(P, I_t, O_t, _params):
    a = _params['fee_numerator']
    b = _params['fee_denominator']
    delta_I = (
        (-(I_t*b + I_t*a)) + sqrt(
            ((I_t*b - I_t*a)**2) + (4*P*O_t*I_t*a*b)
        )
    )  / (2*a)

    return int(delta_I)

def unprofitable_transaction(I_t, O_t, delta_I, delta_O, action_key, _params):
    fix_cost = _params['fix_cost']
    if(fix_cost != -1):
      if(action_key == 'eth_sold'): # TokenPurchase
          after_P = 1 / get_output_amount(1, I_t, O_t, _params)
          profit = int(abs(delta_O*after_P) - (delta_I))
      else: # EthPurchase
          after_P = get_input_amount(1, I_t, O_t, _params) / 1
          profit = int(abs(delta_O) - int(delta_I/after_P))
      return (profit < fix_cost)
    else:
      return False

def addLiquidity_DAI(_params, substep, sH, s, _input):
    eth_reserve = int(s['ETH_balance'])
    token_reserve = int(s['DAI_balance'])
    if _input['eth_deposit'] == 0:
        token_amount = 0
    else:
        token_amount = int(_input['eth_deposit'] * token_reserve // eth_reserve + 1)
    return ('DAI_balance', token_reserve + token_amount)

def removeLiquidity_DAI(_params, substep, sH, s, _input):
    token_reserve = int(s['DAI_balance'])
    pct_amount = _input['UNI_pct']
    amount = token_reserve * pct_amount
    return ('DAI_balance', int(token_reserve - amount))

def ethToToken_DAI(_params, substep, sH, s, _input):
    delta_I = int(_input['eth_sold']) #amount of ETH being sold by the user
    I_t = int(s['ETH_balance'])
    O_t = int(s['DAI_balance'])
    if delta_I == 0:
        return ('DAI_balance', O_t)
    else:
        delta_O = int(get_output_amount(delta_I, I_t, O_t, _params))
        return ('DAI_balance', O_t - delta_O)

def tokenToEth_DAI(_params, substep, sH, s, _input):
    delta_I = int(_input['tokens_sold']) #amount of tokens being sold by the user
    I_t = int(s['DAI_balance'])
    return ('DAI_balance', I_t + delta_I)

def addLiquidity_ETH(_params, substep, sH, s, _input):
    eth_reserve = int(s['ETH_balance'])
    return ('ETH_balance', eth_reserve + _input['eth_deposit'])

def removeLiquidity_ETH(_params, substep, sH, s, _input):
    eth_reserve = int(s['ETH_balance'])
    pct_amount = _input['UNI_pct']
    amount = pct_amount * eth_reserve
    return ('ETH_balance', int(eth_reserve - amount))

def ethToToken_ETH(_params, substep, history, s, _input):
    delta_I = int(_input['eth_sold']) #amount of ETH being sold by the user
    I_t = int(s['ETH_balance'])
    return ('ETH_balance', I_t + delta_I)

def tokenToEth_ETH(_params, substep, sH, s, _input):
    delta_I = int(_input['tokens_sold']) #amount of tokens being sold by the user
    O_t = int(s['ETH_balance'])
    I_t = int(s['DAI_balance'])
    if delta_I == 0:
        return ('ETH_balance', O_t)
    else:
        delta_O = int(get_output_amount(delta_I, I_t, O_t, _params))
        return ('ETH_balance', O_t - delta_O)

def addLiquidity_UNI(_params, substep, sH, s, _input):
    total_liquidity = int(s['UNI_supply'])
    eth_reserve = int(s['ETH_balance'])
    liquidity_minted = int(_input['eth_deposit'] * total_liquidity // eth_reserve)
    return ('UNI_supply', total_liquidity + liquidity_minted)

def removeLiquidity_UNI(_params, substep, sH, s, _input):
    total_liquidity = int(s['UNI_supply'])
    pct_amount = _input['UNI_pct']
    amount = total_liquidity * pct_amount
    return ('UNI_supply', int(total_liquidity - amount))
from models.updates import *

partial_state_update_blocks = [
    { 
        'policies': {
            'user_action': p_actionDecoder
        },
        'variables': {
            'DAI_balance': s_mechanismHub_DAI,
            'ETH_balance': s_mechanismHub_ETH,
            'UNI_supply': s_mechanismHub_UNI,
            'price_ratio': s_price_ratio
        }
    }
]
import pandas as pd
import numpy as np

def add_trading_volume(exp_df):
    # calculating traiding volume at each step
    exp_df['delta_dai'] = exp_df['DAI_balance'].diff()
    exp_df['delta_eth'] = exp_df['ETH_balance'].diff()
    exp_df['istrade'] = (exp_df['delta_dai'] > 0) != (exp_df['delta_eth'] > 0)
    exp_df['volume'] = abs(exp_df[exp_df['istrade']]['delta_dai'])
    exp_df['volume'] = exp_df['volume'].fillna(0)
    exp_df = exp_df.drop(columns=['delta_dai','delta_eth','istrade'])
    return exp_df
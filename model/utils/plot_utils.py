import matplotlib.pyplot as plt
import numpy as np

def plot_fee_impact(models,fees,real_history=''):
    import matplotlib.pyplot as plt
    nplots = len(set(fees))
    nrows = 1
    ncols = 3

    fig, axs = plt.subplots(ncols = ncols, nrows = nrows, figsize=(20 ,5))

    plt.close()
    if len(real_history):
        for ii,ilabel in enumerate(['ETH_balance','DAI_balance','UNI_supply']):
            axs[ii].plot(real_history[f'real_{ilabel}'], label='Real history')
            axs[ii].set_title(f'Model {ilabel}', fontsize=18)
    
    for ii,ilabel in enumerate(['ETH_balance','DAI_balance','UNI_supply']):
        for k in range(nplots):
            axs[ii].plot(models[k][f'{ilabel}'],
                        label='Fee @ {:.1f}%'.format(fees[k]))
        axs[ii].set_title(ilabel)
        axs[ii].legend(loc='upper left')
        

    fig.tight_layout(pad=4.0)
    return fig

def plot_agenttype_return(plots_df,fees):
    def ExpMovingAverage(values, window):
        weights = np.exp(np.linspace(-1., 0., window))
        weights /= weights.sum()
        a =  np.convolve(values, weights, mode='full')[:len(values)]
        a[:window] = a[window]
        return a

    nplots = len(set(fees))


    fig, ax = plt.subplots(figsize=(10,5))

    
    ax.plot(plots_df[0]['ETH_holder_return'], label=f'ETH holder')
    ax.plot(plots_df[0]['50_50_holder_return'], label='50/50 holder')

    ax.axhline(0, color='gainsboro')
    ax.set_ylabel('ROI (change ratio in DAI)')
    for k in range(nplots):
        ema = ExpMovingAverage(plots_df[k]['UNI_holder_return'], 1)
        ax.plot(ema, label='Liq. Provider with fee @ {:.1f} %'.format(fees[k ]))
        ax.legend(loc='upper left')


    fig.set_facecolor('white')
    fig.tight_layout(pad=4.0)
    fig.show()
    return 
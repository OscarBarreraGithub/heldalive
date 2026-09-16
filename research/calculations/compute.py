"""Offline, reproducible resource accounting and abstract containment mathematics.

No host discovery, malware, communications, model execution, or propagation code.
All epidemic times are dimensionless clearance-time units, not fitted forecasts.
Run from any directory with the repository .venv Python.
"""
from pathlib import Path
import csv
import itertools
import json
import math
import platform
import numpy as np
import scipy
from scipy.linalg import expm
from scipy.integrate import solve_ivp
from scipy.stats import binom
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'calculations'
FIG = ROOT / 'tex' / 'figures'
FIG.mkdir(exist_ok=True)
GB, GiB = 10**9, 2**30
checks = {}

def screen(pt, pa, r, q=4, memory=8*GB, flop=100*GB, bandwidth=10*GB):
    weights = pt*q/8
    work = 2*pa
    traffic = pa*q/8
    terms = [weights/memory, r*work/flop, r*traffic/bandwidth]
    return math.ceil(max(terms)), terms

models = [('SmolLM2 nominal', 1.7e9, 1.7e9),
          ('Qwen3.5-9B nominal', 9e9, 9e9),
          ('DeepSeek-V3 main model', 671e9, 37e9),
          ('Synthetic dense 1T', 1e12, 1e12),
          ('Synthetic MoE 10T / 1T', 1e13, 1e12),
          ('Synthetic dense 10T', 1e13, 1e13)]
resources = []
for name,pt,pa in models:
    n1,t1 = screen(pt,pa,1)
    n10,t10 = screen(pt,pa,10)
    resources.append(dict(model=name,total=pt,active=pa,raw_weights_GB=pt/2/GB,
                          GFLOP_per_token=2*pa/GB,traffic_GB_per_token=pa/2/GB,
                          screen_1=n1,screen_10=n10,terms_1=t1,terms_10=t10))
assert [r['screen_1'] for r in resources] == [1,1,42,63,625,625]
assert [r['screen_10'] for r in resources] == [1,5,42,500,625,5000]
checks['nominal_resource_table'] = 'pass'

smol = json.loads((ROOT/'sources/smollm2-config.json').read_text())
qwen = json.loads((ROOT/'sources/qwen35-config.json').read_text())['text_config']
smol_P = smol['vocab_size']*smol['hidden_size'] + smol['num_hidden_layers']*(
    4*smol['hidden_size']**2+3*smol['hidden_size']*smol['intermediate_size']+
    2*smol['hidden_size'])+smol['hidden_size']
assert smol_P == 1711376384
cache_s = 2*24*8192*32*64*2
cache_q = 2*qwen['layer_types'].count('full_attention')*8192*4*256*2
assert cache_s == 1610612736 and cache_q == 268435456
# Illustrative recurrent matrix layout, not a measured implementation footprint.
rec_q = 24*32*128*128*4
assert rec_q == 50331648
mem_s = .5*1.7e9*1.125+cache_s+GiB
mem_q = .5*9e9*1.125+cache_q+rec_q+GiB
cache_results = dict(smol_exact_parameters=smol_P,smol_KV_bytes=cache_s,
    qwen_full_KV_bytes=cache_q,qwen_illustrative_recurrent_bytes=rec_q,
    smol_budget_GB=mem_s/GB,qwen_budget_GB=mem_q/GB,
    smol_attention_GFLOP=4*24*8192*32*64/GB,
    qwen_full_attention_GFLOP=4*8*8192*16*256/GB,
    smol_traffic_screen_10=math.ceil(10*(.85*GB+cache_s)/(10*GB)),
    qwen_traffic_screen_10=math.ceil(10*(4.5*GB+cache_q)/(10*GB)))
checks['architecture_and_units'] = 'pass'

# Exact scalar mean-field solution, compared with a numerical integrator.
def sis_solution(t, R, x0):
    if R == 1:
        return x0/(1+x0*t)
    a=R-1
    return a*x0*np.exp(a*t)/(a+R*x0*np.expm1(a*t))

ode_errors=[]
ts=np.linspace(0,20,301)
for R in [.8,1.,1.5,2.]:
    sol=solve_ivp(lambda t,x: (R-1)*x-R*x*x,(0,20),[.2],t_eval=ts,
                  rtol=1e-11,atol=1e-13)
    ode_errors.append(float(np.max(abs(sol.y[0]-sis_solution(ts,R,.2)))))
assert max(ode_errors)<1e-9
checks['ODE_max_absolute_error']=max(ode_errors)

def chain(N,R):
    n=np.arange(1,N+1,dtype=float)
    birth=R*n*(1-n/N)
    death=n.copy()
    Q=np.diag(-birth-death)+np.diag(birth[:-1],1)+np.diag(death[1:],-1)
    delta=np.zeros(N)
    delta[-1]=1/death[-1]
    for j in range(N-2,-1,-1):
        delta[j]=(1+birth[j]*delta[j+1])/death[j]
    tau=np.cumsum(delta)
    return Q,tau

extinction=[]
for R in [.8,1.,1.5,2.]:
    Q,tau=chain(40,R)
    direct=np.linalg.solve(-Q,np.ones(40))
    residual=float(np.max(np.abs(Q@tau+1)))
    relative=float(np.max(np.abs(direct-tau)/tau))
    assert relative < 1e-9
    survival=float(expm(20*Q)[19].sum())
    eigvals=np.linalg.eigvals(Q)
    qsd_decay=float(-max(eigvals.real))
    extinction.append(dict(R=R,N=40,start=20,mean_time=float(tau[19]),
        survival_at_20=survival,qsd_mean=1/qsd_decay,residual=residual,
        relative_disagreement=relative))
checks['backward_equation_relative_error']=max(x['relative_disagreement'] for x in extinction)

# Finite-horizon Gillespie validation against matrix exponential, fixed seed.
rng=np.random.default_rng(20260915)
replicates=6000
survived=0
for run in range(replicates):
    n,t=20,0.
    while n>0 and t<20:
        b=1.5*n*(1-n/40)
        d=n
        t+=rng.exponential(1/(b+d))
        if t>=20:
            break
        n+=1 if rng.random()<b/(b+d) else -1
    survived+=int(n>0)
p_exact=extinction[2]['survival_at_20']
p_mc=survived/replicates
se=math.sqrt(p_exact*(1-p_exact)/replicates)
z=(p_mc-p_exact)/se
assert abs(z)<4
mc=dict(seed=20260915,trials=replicates,exact=p_exact,estimate=p_mc,
        standard_error=se,z_score=z)
checks['Gillespie_vs_exact_z_score']=z

# Nine-node star: enumerate every one-node durable removal, no optimization.
A=np.zeros((9,9));A[0,1:]=1;A[1:,0]=1
rho=lambda a: float(max(abs(np.linalg.eigvals(a)))) if a.size else 0.
removed=[]
for i in range(9):
    keep=[j for j in range(9) if j!=i]
    removed.append(.4*rho(A[np.ix_(keep,keep)]))
assert np.allclose(removed,[0]+[.4*math.sqrt(7)]*8)
network=dict(before=.4*rho(A),after_hub=removed[0],after_leaf=removed[1],
    probability_below_threshold=sum(r<1 for r in removed)/9,
    average_radius=float(np.mean(removed)))
checks['network_enumeration']='pass'

avail=dict(all_10=.9**10,at_least_8_of_10=float(binom.sf(7,10,.9)),
           all_10_with_common_failure=.8*.9**10)
mu,dw,alpha,sigma=1.,.1,.02,.5
L=np.array([[-mu,alpha],[sigma,-dw]])
eigs=np.linalg.eigvals(L)
formula=np.array([-(mu+dw)/2+math.sqrt((mu-dw)**2+4*alpha*sigma)/2,
                  -(mu+dw)/2-math.sqrt((mu-dw)**2+4*alpha*sigma)/2])
assert np.allclose(sorted(eigs),sorted(formula))
eps,K=.05,100
loss_time=-math.log(-math.expm1(math.log1p(-eps)/K))
archive=dict(mu=mu,delta_W=dw,alpha=alpha,sigma=sigma,eigenvalues=eigs.real.tolist(),
    determinant=mu*dw-alpha*sigma,copy_count=K,epsilon=eps,
    scaled_loss_time=loss_time,union_bound_time=math.log(K/eps),
    survival_at_loss_time=-math.expm1(K*math.log1p(-math.exp(-loss_time))))
assert abs(archive['survival_at_loss_time']-eps)<1e-12
checks['archive_eigenvalues_and_probability']='pass'

sensitivity=[]
for name,pt,pa in models[3:]:
    ns=[screen(pt,pa,r,q=q,memory=m*GB,flop=f*GB,bandwidth=b*GB)[0]
        for q,m,f,b,r in itertools.product([4,8,16],[4,8,16,32],[25,100,400],[2.5,10,40],[1,10])]
    sensitivity.append(dict(model=name,minimum=min(ns),maximum=max(ns)))

plt.rcParams.update({'font.size':10,'axes.spines.top':False,'axes.spines.right':False,
                     'pdf.fonttype':42,'ps.fonttype':42})
fig,ax=plt.subplots(1,2,figsize=(9.6,3.2),layout='constrained')
ctx=np.linspace(0,8192,100)
ax[0].plot(ctx,(.5*1.7e9*1.125+2*24*ctx*32*64*2+GiB)/GB,label='SmolLM2, nominal 1.7B')
ax[0].plot(ctx,(.5*9e9*1.125+2*8*ctx*4*256*2+rec_q+GiB)/GB,label='Qwen3.5-9B')
ax[0].set(xlabel='Cached tokens',ylabel='Illustrative resident memory (GB)')
ax[0].legend(fontsize=8)
for R in [.8,1.,1.5,2.]:
    ax[1].plot(ts,sis_solution(ts,R,.2),label=f'R = {R:g}')
ax[1].set(xlabel='Clearance-time units',ylabel='Mean-field affected fraction',ylim=(0,.6))
ax[1].legend(fontsize=8,ncol=2)
fig.savefig(FIG/'resource_dynamics.pdf');plt.close(fig)

fig,ax=plt.subplots(1,2,figsize=(9.6,3.2),layout='constrained')
survival_ts=np.linspace(0,30,81)
for R in [.8,1.,1.5]:
    Q,tau=chain(40,R)
    values=[expm(t*Q)[19].sum() for t in survival_ts]
    ax[0].plot(survival_ts,values,label=f'R = {R:g}')
ax[0].set(xlabel='Clearance-time units',ylabel='Probability not yet extinct',ylim=(0,1.02))
ax[0].legend(fontsize=8)
u=np.linspace(0,12,200)
for k in [1,10,100]:
    p=1-(1-np.exp(-u))**k
    ax[1].plot(u,p,label=f'{k} initial copies')
ax[1].set(xlabel='Copy-loss-time units',ylabel='Probability any copy remains',ylim=(0,1.02))
ax[1].legend(fontsize=8)
fig.savefig(FIG/'extinction_archive.pdf');plt.close(fig)

data=dict(resources=resources,cache=cache_results,extinction=extinction,monte_carlo=mc,
          network=network,availability=avail,archive=archive,sensitivity=sensitivity,
          transfer_5TB_1Gbit_hours=8*5e12/1e9/3600,checks=checks,
          environment=dict(python=platform.python_version(),numpy=np.__version__,
                           scipy=scipy.__version__,matplotlib=matplotlib.__version__))
(OUT/'results.json').write_text(json.dumps(data,indent=2)+'\n')
with (OUT/'resources.csv').open('w') as f:
    fields=['model','total','active','raw_weights_GB','GFLOP_per_token','traffic_GB_per_token','screen_1','screen_10']
    w=csv.DictWriter(f,fields,extrasaction='ignore');w.writeheader();w.writerows(resources)
with (OUT/'extinction.csv').open('w') as f:
    w=csv.DictWriter(f,extinction[0].keys());w.writeheader();w.writerows(extinction)
print(json.dumps(data,indent=2))

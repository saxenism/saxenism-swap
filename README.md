# Aim of the project 🍾

Aiming to build a simple AMM where: 
1. Only the contract creator can supply initial liquidity.
2. The tokens traded on the AMM are IERC20.
3. Only 2 tokens are inside the pool.
4. Any external actor can come to the AMM and swap token A to token B and vice versa.
5. The initial price is tokenASupplied / tokenBSupplied.
6. Any trade should move the price.
7. A 0.5% fee is taken on each swap.

# Deployments (Kovan Testnet)
1. TokenA is deployed to:  [0x96273AAc53dED55e0cE26E7dd4d834662F163516](https://kovan.etherscan.io/address/0x96273AAc53dED55e0cE26E7dd4d834662F163516)
2. saxenism-swap is deployed to:  [0x292ADe4ccC74D415B85Ef899B8fcC9efD9B63C66](https://kovan.etherscan.io/address/0x292ade4ccc74d415b85ef899b8fcc9efd9b63c66)

# Details about the project

1. Used a *Moralis* node and deployed the AMM (saxenism-swap) to the Kovan Ethereum test network.
2. There is a singular contract called `ExchangeBusinessLogic.sol` that contains the business logic of carrying out trades/exchanges between only two tokens. No contract factory has been created for introducing multiple pairs.
3. The tokens in the pool are **Ether** (kETH) and another token called **Nethermind Token (NETMD)** deployed at [0x96273AAc53dED55e0cE26E7dd4d834662F163516](https://kovan.etherscan.io/address/0x96273AAc53dED55e0cE26E7dd4d834662F163516) on the Kovan test network.
4. The total supply of **NETMD** is 100,000,000,000 with 18 decimal places.
5. Contract deployer is the address `0x917A525DEe98DF975C8D47C5510BF0493f9C8299`.
6. The contract deployer also has the entire supply of **NETMD** initially.
7. The price of the assets in the pool is set by the initial supply of tokens by the contract creator. The price for either is ratio of the two supplied quantities.
8. A constant product market maker algorithm has been used. Theroretically, that is (Quantity of tokenA) * (Quantity of tokenB) = k or x * y = k.
9. But, practically after every trade one token's quantity increases while the other's quantity decreases. With that in mind, the formula I used is: (x + dx) * (y - dy) = k.
10. This formula ensures that the exchange wouldn't be drained of any token as the parabolic price function now ensures that every trade moves up the price.
11. All liquidity providers after the initial liquidity provider can only provide liquidity in the ratio set by the initial liqudity provider.
12. Since a fee of 0.5% is levied on every trade, it has to be divided among the LPs in proportion of the liquidity that they provided.
13. So, every liquidity provider is issued LP tokens which can be used to redeem the LP's liquidity and the interest earned from exchange fee.
14. Formula used for distributing the LP tokens such that they always represent the correct ratio is:


    `LPTokensMinted = (totalSupplyOfLPTokens * etherDeposited) / etherInContract`
15. I could also have used the reserves of **NETMD**, but I went ahead with ether reserves.






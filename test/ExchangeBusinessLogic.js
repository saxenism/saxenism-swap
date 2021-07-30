// function withdrawLiquidity(uint _amount) public returns (uint, uint)
// function getTokenBalance() public view returns (uint)
// function getTokenAmount(uint _etherInjected) public view returns (uint)
// function getEthAmount(uint _tokenInjected) public view returns (uint)
// function swapToken(uint _tokenInjected, uint _minEther) public payable

const {expect} = require("chai");
const {ethers} = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
require("@nomiclabs/hardhat-waffle");

const toWei = function(value) {
   return ethers.utils.parseEther(value.toString());
}

const fromWei = function(value) {
    return ethers.utils.formatEther(typeof value === "string" ? value : value.toString());
}

const getBalance = ethers.provider.getBalance;

describe("ExchangeBusinessLogic", () => {
    let owner;
    let user;
    let saxenismSwap;

    beforeEach(async () => {
        [owner, user] = await ethers.getSigners();

        const TokenA = await ethers.getContractFactory("TokenA");
        tokenA = await TokenA.deploy(toWei(10000));
        await tokenA.deployed();

        const Exchange = await ethers.getContractFactory("ExchangeBusinessLogic");
        saxenismSwap = await Exchange.deploy(tokenA.address);
        await saxenismSwap.deployed();
    });

    it("saxenism-swap is deployed and LP tokens are ready", async() => {
        expect(await saxenismSwap.symbol()).to.equal("SSLP");
        expect(await saxenismSwap.name()).to.equal("Saxenism Swap LP");
        //Initially supply of the LP tokens is 0, since pool is empty.
        expect(await saxenismSwap.totalSupply()).to.equal(0);
        // console.log(owner.address);
        // console.log(saxenismSwap.address);
        // console.log(tokenA.address);
    });

    describe("providing liquidity", async() => {
        describe("initial liquidity", async() => {
            it("provides liquidity", async() => {
                await tokenA.approve(saxenismSwap.address, toWei(1000));
                await saxenismSwap.provideLiquidity(toWei(1000), {value: toWei(10) });

                expect(await getBalance(saxenismSwap.address)).to.equal(toWei(10));
                expect(await saxenismSwap.getTokenBalance()).to.equal(toWei(1000));
            });

            it("LP tokens are minted", async() => {
                await tokenA.approve(saxenismSwap.address, toWei(1000));
                await saxenismSwap.provideLiquidity(toWei(1000), {value: toWei(10)});

                expect(await saxenismSwap.balanceOf(owner.address)).to.equal(toWei(10));
                //The total supply of LP tokens should be equal to the Ether supplied for the initial Liquidity addition
                expect(await saxenismSwap.totalSupply()).to.equal(toWei(10));
            });

            it("check 0 amounts by LP", async() => {
                await tokenA.approve(saxenismSwap.address, 0);
                await saxenismSwap.provideLiquidity(0, {value: 0});

                expect(await getBalance(saxenismSwap.address)).to.equal(0);
                expect(await saxenismSwap.getTokenBalance()).to.equal(0);
            });
        });

        describe("LPs after the owner", async() => {
            beforeEach(async() => {
                await tokenA.approve(saxenismSwap.address, toWei(2000));
                await saxenismSwap.provideLiquidity(toWei(1000), {value: toWei(10)});
            });

            it("Exchange rate remains constant", async() => {
                await saxenismSwap.provideLiquidity(toWei(600), {value: toWei(5)});

                expect(await getBalance(saxenismSwap.address)).to.equal(toWei(15));
                //Our exchange ignored the extra 100 tokenA that was injected into the contract to maintain the ratio of tokens
                expect(await saxenismSwap.getTokenBalance()).to.equal(toWei(1500));
            });

            it("LP tokens keep on getting minted", async() => {
                await saxenismSwap.provideLiquidity(toWei(500), {value: toWei(5)});

                expect(await saxenismSwap.balanceOf(owner.address)).to.equal(toWei(15));
                expect(await saxenismSwap.totalSupply()).to.equal(toWei(15));
            });

            it("Txn fail when min tokens not rendered", async() => {
                await expect(saxenismSwap.provideLiquidity(toWei(25), {value: toWei(20)})
                ).to.be.revertedWith("Insufficient Token Balance");
            });
        });
    });

    describe("withdrawing Liquidity", async () => {
        beforeEach(async() => {    
            await tokenA.approve(saxenismSwap.address, toWei(2000));
            await saxenismSwap.provideLiquidity(toWei(1000), {value: toWei(10)});
        }); 

        it("removes partial liquidity", async () => {
            await saxenismSwap.withdrawLiquidity(toWei(5)); //toWei(5) is the number of LP Tokens being returned

            expect(await saxenismSwap.getTokenBalance()).to.equal(toWei(500));
            expect(await getBalance(saxenismSwap.address)).to.equal(toWei(5));
        });

        it("withdraw all liquidity", async() => {
            await saxenismSwap.withdrawLiquidity(toWei(10)); //Removing all LP tokens

            expect(await saxenismSwap.getTokenBalance()).to.equal(0);
            expect(await getBalance(saxenismSwap.address)).to.equal(0);
        });

        it("proportional pay-outs to LP depositors", async() => {
            // Since the initial liquidity was provided by the owner 
            const etherBalanceBefore = await getBalance(owner.address);
            const tokenABalanceBefore = await tokenA.balanceOf(owner.address);
            
            await saxenismSwap.connect(user).swapEther(toWei(300), {value: toWei(5)});

            // Owner deposits all his initial tokens for withdrawing liquidity
            await saxenismSwap.withdrawLiquidity(toWei(10));

            expect(await saxenismSwap.getTokenBalance()).to.equal(toWei(0));
            expect(await getBalance(saxenismSwap.address)).to.equal(toWei(0));
            expect(await fromWei(await tokenA.balanceOf(user.address))).to.equal("332.220367278797996661");

            const etherBalanceAfter = await getBalance(owner.address);
            const tokenABalanceAfter = await tokenA.balanceOf(owner.address);

            expect(fromWei(etherBalanceAfter.sub(etherBalanceBefore))).to.equal("14.999745264"); // 10 plus the Ether that user infused into the exchange
            expect(fromWei(tokenABalanceAfter.sub(tokenABalanceBefore))).to.equal("667.779632721202003339"); //1000 minus the tokenA that user took out of the exchange
        })

        it("destroys LP tokens", async() => {
            await expect(() => 
                saxenismSwap.withdrawLiquidity(toWei(3))).
                to.changeTokenBalance(saxenismSwap, owner, toWei(-3));

                expect(await saxenismSwap.totalSupply()).to.equal(toWei(7));
        });

        it("makes sure LP tokens value is legit", async () => {
            await expect(saxenismSwap.withdrawLiquidity(toWei(11))).to.be.revertedWith(
                "burn amount exceeds balance"
            );
        });
    });

    describe("tokenATradeTests", async() => {
        it("tokenA offered for different Ether", async() => {
             await tokenA.approve(saxenismSwap.address, toWei(5000));
             await saxenismSwap.provideLiquidity(toWei(5000), {value: toWei(1000)});

             let tokenAOwed = await saxenismSwap.getTokenAmount(toWei(1));
             expect(fromWei(tokenAOwed)).to.equal("4.970054795478498893");

             tokenAOwed = await saxenismSwap.getTokenAmount(toWei(100));
             expect(fromWei(tokenAOwed)).to.equal("452.478399272396543883");

             tokenAOwed = await saxenismSwap.getTokenAmount(toWei(900));
             expect(fromWei(tokenAOwed)).to.equal("2362.173568979161171194");
        }); 
     });

     describe("EtherTradeTests", async() => {
        it("Ether offered for different tokenA", async() => {
            await tokenA.approve(saxenismSwap.address, toWei(5000));
            await saxenismSwap.provideLiquidity(toWei(5000), {value: toWei(1000)});

            let etherOwed = await saxenismSwap.getEthAmount(toWei(1));
            expect(fromWei(etherOwed)).to.eq("0.198960406879031072");

            etherOwed = await saxenismSwap.getEthAmount(toWei(500));
            expect(fromWei(etherOwed)).to.eq("90.495679854479308776");

            etherOwed = await saxenismSwap.getEthAmount(toWei(4500));
            expect(fromWei(etherOwed)).to.eq("472.434713795832234238");
        })
     });

     describe("Ether Swaps", async () => {
        beforeEach(async() => {
            await tokenA.approve(saxenismSwap.address, toWei(5000));
            await saxenismSwap.provideLiquidity(toWei(5000), {value: toWei(500)});
        });

        it("minimum tokens are transfered always", async() => {
            const userTokenABalanceBeforeTrade = await tokenA.balanceOf(user.address);

            await saxenismSwap.connect(user).swapEther(toWei(800), {value: toWei(100)});

            const userTokenABalanceAfterTrade = await tokenA.balanceOf(user.address);

            expect(fromWei(userTokenABalanceAfterTrade.sub(userTokenABalanceBeforeTrade))). 
            to.equal("829.858215179316096747");
        });

        it("exchange rate changes", async() => {
            let etherSwapped = await saxenismSwap.getTokenAmount(toWei(100));
            expect(fromWei(etherSwapped)).to.eq("829.858215179316096747");

            await saxenismSwap.connect(user).swapEther(toWei(80), {value: toWei(10)});

            etherSwapped = await saxenismSwap.getTokenAmount(toWei(100));
            expect(fromWei(etherSwapped)).to.eq("800.316523174069808996");
        });

        it("reverts when amount available is less than min specified", async() => {
            await expect(saxenismSwap.connect(user).swapEther(toWei(10), {value: toWei(1)})).
            to.be.revertedWith("Insufficient tokens available. Adjust slippage.");
        });

        it("allows idle swaps", async() => {
            const userBalanceBeforeTrade = await saxenismSwap.getTokenBalance();
            const exchangeBalanceBeforeTrade = await getBalance(saxenismSwap.address);
            const exchangeTokenABalanceBeforeTrade = await saxenismSwap.getTokenBalance();

            await saxenismSwap.connect(user).swapEther(toWei(0), {value: toWei(0)});

            const userBalanceAfterTrade = await saxenismSwap.getTokenBalance();
            const exchangeBalanceAfterTrade = await getBalance(saxenismSwap.address);
            const exchangeTokenABalanceAfterTrade = await saxenismSwap.getTokenBalance();

            expect(fromWei(userBalanceAfterTrade.sub(userBalanceBeforeTrade))).to.eq("0.0");
            expect(fromWei(exchangeBalanceAfterTrade.sub(exchangeBalanceBeforeTrade))).to.eq("0.0");
            expect(fromWei(exchangeTokenABalanceAfterTrade)).to.equal(fromWei(exchangeTokenABalanceBeforeTrade));
        });
     });

     describe("TokenA Swaps", async() => {
        beforeEach(async () => {
            await tokenA.transfer(user.address, toWei(100));
            await tokenA.connect(user).approve(saxenismSwap.address, toWei(100));

            await tokenA.approve(saxenismSwap.address, toWei(5000));
            await saxenismSwap.provideLiquidity(toWei(5000), {value: toWei(500)});
        });

        it("minimum tokens are transfered always", async() => {
            const userEtherBalanceBeforeTrade = await getBalance(user.address);

            await saxenismSwap.connect(user).swapToken(toWei(50), toWei(4.5));

            const userEtherBalanceAfterTrade = await getBalance(user.address);

            expect(fromWei(userEtherBalanceAfterTrade.sub(userEtherBalanceBeforeTrade))). 
            to.equal("4.925511346972028318");
        });

        it("exchange rate changes", async () => {
            let tokenASwapped = await saxenismSwap.getEthAmount(toWei(1000));
            expect(fromWei(tokenASwapped)).to.eq("82.985821517931609674");

            await saxenismSwap.connect(user).swapToken(toWei(100), toWei(8));

            tokenASwapped = await saxenismSwap.getEthAmount(toWei(1000));
            expect(fromWei(tokenASwapped)).to.eq("80.031652317406980899");
        });

        it("reverts when amount available is less than min tokens", async() => {
            await expect(saxenismSwap.connect(user).swapToken(toWei(100), toWei(10))).
            to.be.revertedWith("Insufficient Ether. Adjust slippage.");
        });

        it("allows idle swap", async() => {
            const userBalanceBeforeTrade = await getBalance(user.address);
            const exchangeBalanceBeforeTrade = await getBalance(saxenismSwap.address);
            const exchangeTokenABalanceBeforeTrade = await saxenismSwap.getTokenBalance();

            await saxenismSwap.connect(user).swapToken(toWei(0), toWei(0));

            const userBalanceAfterTrade = await getBalance(user.address);
            const exchangeBalanceAfterTrade = await getBalance(saxenismSwap.address);
            const exchangeTokenABalanceAfterTrade = await saxenismSwap.getTokenBalance();

            expect(fromWei(userBalanceAfterTrade.sub(userBalanceBeforeTrade))).to.eq("-0.00035304");
            expect(fromWei(exchangeBalanceAfterTrade.sub(exchangeBalanceBeforeTrade))).to.eq("0.0");
            expect(fromWei(exchangeTokenABalanceAfterTrade)).to.equal(fromWei(exchangeTokenABalanceBeforeTrade));
        }); 
     });


});


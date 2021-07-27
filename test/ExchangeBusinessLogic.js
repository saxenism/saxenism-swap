const {expect} = require("chai");
const {ethers} = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
require("@nomiclabs/hardhat-waffle");

const toWei = (value) => ethers.utils.parseEther(value.toString());

const fromWei = (value) =>
  ethers.utils.formatEther(
    typeof value === "string" ? value : value.toString()
  );

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
    });
});


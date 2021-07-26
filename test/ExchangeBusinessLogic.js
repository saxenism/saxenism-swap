const {expect} = require("chai");
const {ethers} = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
require("@nomiclabs/hardhat-waffle");

const toWei = function(value) {
    ethers.utils.parseEther(value.toString());
}

const fromWei = function(value) {
    ethers.utils.formatEther(
        typeof value === "string" ? value : value.toString()
    );
}

const getBalance = ethers.provider.getBalance;

describe("ExchangeBusinessLogic", () => {
    let owner;
    let user;
    let saxenismSwap;

    beforeEach(async () => {
        [owner, user] = await ethers.getSigners();

        const TokenA = await ethers.getContractFactory("TokenA");
        tokenA = await TokenA.deploy(10000);
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
    });

    describe("providing liquidity", async() => {
        describe("initial liquidity", async() => {
            it("provides liquidity", async() => {
                await tokenA.approve(saxenismSwap.address, 1000);
                await saxenismSwap.provideLiquidity(1000, {value: 10 });

                expect(await getBalance(saxenismSwap.address)).to.equal(10);
                expect(await saxenismSwap.getTokenBalance()).to.equal(1000);
            });

            it("LP tokens are minted", async() => {
                await tokenA.approve(saxenismSwap.address, 1000);
                await saxenismSwap.provideLiquidity(1000, {value: 10});

                expect(await saxenismSwap.balanceOf(owner.address)).to.equal(10);
                //The total supply of LP tokens should be equal to the Ether supplied for the initial Liquidity addition
                expect(await saxenismSwap.totalSupply()).to.equal(10);
            });

            it("check 0 amounts by LP", async() => {
                await tokenA.approve(saxenismSwap.address, 0);
                await saxenismSwap.provideLiquidity(0, {value: 0});

                expect(await getBalance(saxenismSwap.address)).to.equal(0);
                expect(await saxenismSwap.getTokenBalance()).to.equal(0);
            });
        });
    })
});
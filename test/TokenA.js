const {expect} = require("chai");
const { ethers } = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("TokenA", () => {
    let owner;
    let tokenA;

    before(async () => {
        [owner] = await ethers.getSigners();

        const TokenA = await ethers.getContractFactory("TokenA");
        tokenA = await TokenA.deploy(10000);
        await tokenA.deployed();
    });

    it("name and symbol are correctly pre-set", async() => {
        expect(await tokenA.name()).to.equal("Nethermind Token");
        expect(await tokenA.symbol()).to.equal("NETMD");
    });

    //Assumption: contract creator == contract deployer == msg.sender
    it("mints initialSupply to contract creator when created", async() => {
        expect(await tokenA.totalSupply()).to.equal(10000);
        expect(await tokenA.balanceOf(owner.address)).to.equal(10000);
    });
});
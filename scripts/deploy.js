const hre = require("hardhat");

async function main() {
  const TokenA = await hre.ethers.getContractFactory("TokenA");
  const tokenA = await TokenA.deploy(100000000000); 

  await tokenA.deployed();

  console.log("TokenA is deployed to: ", tokenA.address);

  const ExchangeBusinessLogic = await hre.ethers.getContractFactory("ExchangeBusinessLogic");
  const saxenismSwap = await ExchangeBusinessLogic.deploy(tokenA.address);
  
  await saxenismSwap.deployed();

  console.log("saxenism-swap is deployed to: ", saxenismSwap.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

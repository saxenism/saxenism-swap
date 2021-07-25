//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ExchangeBusinessLogic is ERC20{
    address tokenAddress; //public by default

    //Hooking up this contract to a tokenAddress that will be used for swapping with Ether
    constructor(address _tokenAddress) ERC20("Saxenism Swap LP", "SSLP"){
        require(_tokenAddress != address(0), "Invalid Token Address");
        tokenAddress = _tokenAddress;
    }

    //function to provide liquidity
    //Ensuring that initial liquidity can only be added by the contract creator
    //Only for the initial addition of liquidity, the ratio of the two tokens can be random, to set the price of the two assets
    // After that, all the liquidity providers, will provide liquidity according to the present ratio of the token amounts in the pool
    // We have to introduce LP tokens, to proportionally distribute the trading fee among all liquidity providers
    // Rest of the options to determine the correct proportion for distribution would be very costly (introduced in provideLiquidity())
    function provideLiquidity(uint _amountToDeposit) public payable returns (uint) {
        if(getTokenBalance() == 0) {
            IERC20 tokenA = IERC20(tokenAddress);
            tokenA.transferFrom(msg.sender, address(this), _amountToDeposit);

            uint liquidity = address(this).balance;
            _mint(msg.sender, liquidity);

            return liquidity;
        } else {
            uint etherInContract = address(this).balance - msg.value; //Since, msg.value is already added into the contract's balance
            uint tokenAInContract = getTokenBalance();
            uint amountToDeposit = (msg.value * tokenAInContract) / etherInContract;

            require(_amountToDeposit >= amountToDeposit, "Insufficient Token Balance");

            IERC20 tokenA = IERC20(tokenAddress);
            tokenA.transferFrom(msg.sender, address(this), amountToDeposit);

            uint liquidity = (msg.value * totalSupply()) / etherInContract;
            _mint(msg.sender, liquidity);

            return liquidity;
        }
    }

    //Function to withdraw liquidity. Parameter: Amount of LP-tokens
    //Simple formula to calculate how much token would be withdrawn for x amount of LP Tokens
    // withdrawnAmount = (tokenReserve * xAmountOfLPTokens)/TotalNumberOfLPTokens
    function withdrawLiquidity(uint _amount) public returns (uint, uint) {
        require(_amount > 0, "Enter a valid amount");

        uint etherAmount = (address(this).balance * _amount) / totalSupply();
        uint tokenAmount = (getTokenBalance() * _amount) / totalSupply();

        _burn(msg.sender, _amount);
        payable(msg.sender).transfer(etherAmount);
        IERC20(tokenAddress).transfer(msg.sender, tokenAmount);

        return (etherAmount, tokenAmount);
    }

    //A utility function to get the tokenA balance of this contract
    function getTokenBalance() public view returns (uint) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    //The naive price function (which is only affected by token amounts) is x/y
    // (x + dx) (y - dy) = xy (xy = k)
    // dy = (y * dx) / (x + dx)
    function getAmount(uint inputAmount, uint inputBalance, uint outputBalance) private pure returns (uint) {
        require(inputBalance > 0 && outputBalance > 0, "Invalid Reserves");

        //return ((outputBalance * inputAmount) / (inputBalance + inputAmount));
        uint inputAmountFeeDeducted = (inputAmount * 995) / 10;
        uint numerator = outputBalance * inputAmountFeeDeducted;
        uint denominator = (inputBalance * 100) + inputAmountFeeDeducted;

        return numerator / denominator;
    }

    function getTokenAmount(uint _etherInjected) public view returns (uint) {
        require(_etherInjected > 0, "Please increase the Ether amount");
        uint tokenBalance = getTokenBalance();

        // This statement will generate the amount of tokenA recieved by the user for injecting
        // _etherInjected amount of Ether into saxenism-swap
        return getAmount(_etherInjected, address(this).balance, tokenBalance);
    }

    function getEthAmount(uint _tokenInjected) public view returns (uint) {
        require(_tokenInjected > 0, "Please increase the token amount");
        uint tokenBalance = getTokenBalance();

        // This statement will generate the amount of Ether recieved by the user for injecting
        // _tokenInjected amount of tokenA into saxenism-swap
        return getAmount(_tokenInjected, tokenBalance, address(this).balance);
    }

    //Function to handle conversion of Ether being injected into saxenism-swap into tokenA
    function swapEther(uint _minTokens) public payable {
        uint tokenReserve = getTokenBalance();
        uint tokensOwed = getAmount(msg.value, (address(this).balance - msg.value), tokenReserve);

        //_minTokens is the least number of tokenA that the user expects to get from the trade
        require(tokensOwed > _minTokens, "Insufficient tokens available. Adjust slippage.");

        IERC20(tokenAddress).transfer(msg.sender, tokensOwed);
    }

    //Function to handle conversion of tokenA being injected into saxenism-swap into Ether
    function swapToken(uint _tokenInjected, uint _minEther) public payable {
        uint tokenReserve = getTokenBalance();
        uint etherOwed = getAmount(_tokenInjected, tokenReserve, address(this).balance);

        //_minEther is the least Eth that the user expects from this trade
        require(etherOwed > _minEther, "Insufficient Ether. Adjust slippage.");

        IERC20(tokenAddress).transferFrom(msg.sender, address(this), _tokenInjected);
        payable(msg.sender).transfer(etherOwed);
    }

    //To implement the fee architecture, we simply deduct the fee from ethers/tokenA that are sent to the contract
    // That fee is accumulated in the contract itself (exchange reserves) and is withdrawable (yes, it changes the constant product but it shouldn't matter much because the fee would be very small compared to the pool size)
    //LPs can trade their LP-tokens for balanced amount of ethers and tokens along with their share of the accumulated fee. Everything is in proportion to their LP tokens

}

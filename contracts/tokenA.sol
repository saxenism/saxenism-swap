//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// By default it will have 18 decimal places, which is fine by me.
contract TokenA is ERC20 {
    constructor(uint256 initialSupply) ERC20("Rock Lee","RKLEE") {
        _mint(msg.sender, initialSupply);
    }
}
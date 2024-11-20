// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
contract PermitToken is ERC20Permit {
    address payable public owner;

    constructor(
        uint256 _initialSupply
    ) ERC20("PermitToken", "PT") ERC20Permit("PermitToken") {
        owner = payable(msg.sender);
        _mint(msg.sender, _initialSupply);
    }

    function mint(address _account, uint256 _value) public payable {
        _mint(_account, _value);
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }
}

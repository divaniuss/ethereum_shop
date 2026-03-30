// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BeerShop {
    address public owner;

    event OrderPaid(address indexed buyer, string orderId, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function payForOrder(string memory orderId) public payable {
        require(msg.value > 0, "value must be greater than zero");
        emit OrderPaid(msg.sender, orderId, msg.value);
    }

    function withdraw() public {
        require(msg.sender == owner, "Not owner");
        (bool success,) = payable(owner).call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }

    function getBalance() public view returns (uint256)
    {
        return address(this).balance;
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract AccessControl {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier authorizeAccess() {
        require(msg.sender == owner, "Unauthorized access");
        _;
    }
}

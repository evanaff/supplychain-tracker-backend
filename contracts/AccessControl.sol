// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract AccessControl {
    address public owner;
    mapping(address => bool) public executors;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == owner, "Unauthorized admin access");
        _;
    }

    modifier onlyExecutor() {
        require(executors[msg.sender] == true, "Unauthorized executor access");
        _;
    }

    function addExecutor(address _executor) public onlyAdmin {
        require(!executors[_executor], "Executor already registered");

        executors[_executor] = true;
    }
}

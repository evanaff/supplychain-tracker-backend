// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract AccessControl {
    address public owner;
    mapping(address => bool) public actors;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == owner, "Unauthorized admin access");
        _;
    }

    modifier onlyActor() {
        require(actors[msg.sender] == true, "Unauthorized actor access");
        _;
    }

    function addActor(address _actor) public onlyAdmin {
        require(!actors[_actor], "actor is already registered");

        actors[_actor] = true;
    }

    function removeActor(address _actor) public onlyAdmin {
        require(actors[_actor], "actor is not registered");

        actors[_actor] = false;
    }
}

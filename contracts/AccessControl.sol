// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract AccessControl {
    address public admin;
    mapping(address => bool) public producers;
    mapping(address => bool) public auditors;
    mapping(address => bool) public distributors;
    
    event ActorAdded(address indexed account, string role);
    event ActorRemoved(address indexed account, string role);
    
    constructor() {
        admin = msg.sender;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Unauthorized Only Admin Access!");
        _;
    }

    modifier onlyProducer() {
        require(producers[msg.sender] == true, "Unauthorized Only Producer Access!");
        _;
    }

    modifier onlyAuditor() {
        require(auditors[msg.sender] == true, "Unauthorized Only Auditor Access!");
        _;
    }

    modifier onlyDistributor() {
        require(distributors[msg.sender] == true, "Unauthorized Only Distributor Access!");
        _;
    }

    function addProducer(address _account) public onlyAdmin {
        require(_account != address(0), "Address Cannot be Empty");
        require(!producers[_account], "Producer Address Already Registered");
        
        producers[_account] = true;
        emit ActorAdded(_account, "Producer");
    }

    function addAuditor(address _account) public onlyAdmin {
        require(_account != address(0), "Address Cannot be Empty");
        require(!auditors[_account], "Auditor Address Already Registered");
        
        auditors[_account] = true;
        emit ActorAdded(_account, "Auditor");
    }

    function addDistributor(address _account) public onlyAdmin {
        require(_account != address(0), "Address Cannot be Empty");
        require(!distributors[_account], "Distributor Address Already Registered");

        distributors[_account] = true;
        emit ActorAdded(_account, "Distributor");
    }
}
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract AccessControl {
    address public admin;
    mapping(address => string) public glnOf;
    mapping(string => bool) public glnUsed;
    mapping(address => bool) public growers;
    mapping(address => bool) public distributors;
    mapping(address => bool) public retailers;

    event ActorAdded(address indexed account, string role);
    event ActorRemoved(address indexed account, string role);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Unauthorized access");
        _;
    }

    modifier onlyGrower() {
        require(growers[msg.sender] == true, "Unauthorized access");
        _;
    }

    modifier onlyActor() {
        require(
            growers[msg.sender] ||
            distributors[msg.sender] ||
            retailers[msg.sender],
            "Unauthorized access"
        );
        _;
    }

    function addGrower(address _account, string memory _gln) public onlyAdmin {
        require(_account != address(0), "Address cannot be empty");
        require(!growers[_account], "Grower address already registered");

        growers[_account] = true;

        require(!glnUsed[_gln], "GLN already used");
        glnUsed[_gln] = true;
        glnOf[_account] = _gln;

        emit ActorAdded(_account, "Grower");
    }

    function addDistributor(
        address _account,
        string memory _gln
    ) public onlyAdmin {
        require(_account != address(0), "Address cannot be empty");
        require(
            !distributors[_account],
            "Distributor address already registered"
        );

        distributors[_account] = true;

        require(!glnUsed[_gln], "GLN already used");
        glnUsed[_gln] = true;
        glnOf[_account] = _gln;

        emit ActorAdded(_account, "Distributor");
    }

    function addRetailer(
        address _account,
        string memory _gln
    ) public onlyAdmin {
        require(_account != address(0), "Address cannot be empty");
        require(!retailers[_account], "Retailer address already registered");

        retailers[_account] = true;

        require(!glnUsed[_gln], "GLN already used");
        glnUsed[_gln] = true;
        glnOf[_account] = _gln;

        emit ActorAdded(_account, "Retailer");
    }
}

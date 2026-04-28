// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract AccessControl {
    address public admin;

    enum Role {
        NONE,
        GROWER,
        DISTRIBUTOR,
        RETAILER
    }
    mapping(address => string) public glnOf;
    mapping(string => bool) public glnUsed;
    mapping(address => Role) public roles;

    event ActorAdded(address indexed account, Role role);
    event ActorRemoved(address indexed account);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Unauthorized access");
        _;
    }

    modifier onlyRole(Role role) {
        require(roles[msg.sender] == role, "Unauthorized access");
        _;
    }

    modifier onlyActor() {
        require(roles[msg.sender] != Role.NONE, "Unauthorized access");
        _;
    }

    function addActor(
        address _account,
        string memory _gln,
        Role _role
    ) public onlyAdmin {
        require(_account != address(0), "Address cannot be empty");

        require(
            roles[_account] == Role.NONE,
            "Actor address already registered"
        );

        require(!glnUsed[_gln], "GLN already used");

        roles[_account] = _role;
        glnUsed[_gln] = true;
        glnOf[_account] = _gln;

        emit ActorAdded(_account, _role);
    }

    function deleteActor(address _account) public onlyAdmin {
        require(_account != address(0), "Address cannot be empty");

        string memory gln = glnOf[_account];

        delete roles[_account];
        delete glnOf[_account];
        glnUsed[gln] = false;

        emit ActorRemoved(_account);
    }
}

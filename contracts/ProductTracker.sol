// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./AccessControl.sol";
import "./SignatureValidator.sol";

contract ProductTracker is AccessControl, SignatureValidator {
    enum Grade {
        UNGRADED, A, B, C, REJECTED
    }

    struct ProductBatch {
        uint256 batchId;
        address producer;
        address auditor;
        Grade grade;
        uint256 harvestDate;
        uint256 expiryDate;
        string ipfsHash;
        string status;
        bool isVerified;
    }

    mapping(uint256 => ProductBatch) public batches;
    uint256[] public batchIds;

    event BatchCreated(uint256 indexed batchId, address producer);
    event BatchAudited(uint256 indexed batchId, address auditor, Grade grade, string ipfsHash);
    event StatusUpdated(uint256 indexed batchId, address distributor, string status);

    function registerBatch(
        uint256 _batchId,
        uint256 _harvestDate,
        uint256 _expiryDate,
        bytes memory _signature
    ) public onlyProducer {
        bytes32 messageHash = keccak256(abi.encodePacked(_batchId, _harvestDate, _expiryDate));
        require(_verifySignature(msg.sender, messageHash, _signature), "Invalid signature");

        // TODO: Add ProductBatch to mapping and emit BatchCreated event
    }

    function auditBatch(
        uint256 _batchId,
        Grade _grade,
        string memory _ipfsHash,
        bytes memory _signature
    ) public onlyAuditor {
        bytes32 messageHash = keccak256(abi.encodePacked(_batchId, _grade, _ipfsHash));
        require(_verifySignature(msg.sender, messageHash, _signature), "Invalid signature");

        // TODO: Update ProductBatch with audit info and emit BatchAudited event
    }

    function updateTransferStatus(
        uint256 _batchId,
        string memory _newStatus,
        bytes memory _signature
    ) public onlyDistributor {
        bytes32 messageHash = keccak256(abi.encodePacked(_batchId,_newStatus));
        require(_verifySignature(msg.sender, messageHash, _signature), "Invalid signature");

        // TODO: Update ProductBatch with new status and emit StatusUpdated event
    }

    function getFefoRecommendation() public view returns (uint256[] memory) {
        // TODO: Implement FEFO recommendation logic based on batch expiry dates and grades
    }
}

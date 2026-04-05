// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./AccessControl.sol";
import "./SignatureValidator.sol";

contract ProductTracker is AccessControl, SignatureValidator {
    enum Grade {
        UNGRADED,
        A,
        B,
        C,
        REJECTED
    }

    enum Status {
        REGISTERED,
        AUDITED,
        IN_TRANSIT,
        DELIVERED
    }

    struct ProductBatch {
        uint256 batchId;
        address producer;
        address auditor;
        Grade grade;
        uint256 harvestDate;
        uint256 expiryDate;
        string ipfsHash;
        Status status;
        bool isVerified;
    }

    mapping(uint256 => ProductBatch) public batches;
    uint256[] public batchIds;

    event BatchCreated(uint256 indexed batchId, address producer);
    event BatchAudited(
        uint256 indexed batchId,
        address auditor,
        Grade grade,
        string ipfsHash
    );
    event StatusUpdated(
        uint256 indexed batchId,
        address distributor,
        Status status
    );

    function registerBatch(
        uint256 _batchId,
        uint256 _harvestDate,
        uint256 _expiryDate,
        bytes memory _signature
    ) public onlyProducer {
        bytes32 messageHash = keccak256(
            abi.encodePacked(_batchId, _harvestDate, _expiryDate)
        );
        require(
            _verifySignature(msg.sender, messageHash, _signature),
            "Invalid signature"
        );

        require(batches[_batchId].batchId == 0, "Batch ID already exists");

        ProductBatch memory newBatch = ProductBatch({
            batchId: _batchId,
            producer: msg.sender,
            auditor: address(0),
            grade: Grade.UNGRADED,
            harvestDate: _harvestDate,
            expiryDate: _expiryDate,
            ipfsHash: "",
            status: Status.REGISTERED,
            isVerified: false
        });
        batches[_batchId] = newBatch;
        batchIds.push(_batchId);

        emit BatchCreated(_batchId, msg.sender);
    }

    function auditBatch(
        uint256 _batchId,
        Grade _grade,
        string memory _ipfsHash,
        bytes memory _signature
    ) public onlyAuditor {
        bytes32 messageHash = keccak256(
            abi.encodePacked(_batchId, _grade, _ipfsHash)
        );
        require(
            _verifySignature(msg.sender, messageHash, _signature),
            "Invalid signature"
        );

        require(batches[_batchId].batchId != 0, "Batch not found");
        require(
            batches[_batchId].status == Status.REGISTERED,
            "Batch not in registered status"
        );

        batches[_batchId].auditor = msg.sender;
        batches[_batchId].grade = _grade;
        batches[_batchId].ipfsHash = _ipfsHash;
        batches[_batchId].status = Status.AUDITED;

        if (_grade == Grade.REJECTED) {
            batches[_batchId].isVerified = false;
        } else {
            batches[_batchId].isVerified = true;
        }

        emit BatchAudited(_batchId, msg.sender, _grade, _ipfsHash);
    }

    function updateTransferStatus(
        uint256 _batchId,
        Status _newStatus,
        bytes memory _signature
    ) public onlyDistributor {
        bytes32 messageHash = keccak256(abi.encodePacked(_batchId, _newStatus));
        require(
            _verifySignature(msg.sender, messageHash, _signature),
            "Invalid signature"
        );

        require(batches[_batchId].batchId != 0, "Batch not found");
        require(
            batches[_batchId].status != Status.DELIVERED,
            "Batch already delivered"
        );
        require(batches[_batchId].isVerified == true, "Batch not verified");

        batches[_batchId].status = _newStatus;

        emit StatusUpdated(_batchId, msg.sender, _newStatus);
    }

    function getAllBatches() public view returns (ProductBatch[] memory) {
        uint256 totalBatches = batchIds.length;
        ProductBatch[] memory allBatches = new ProductBatch[](totalBatches);

        for (uint256 i = 0; i < totalBatches; i++) {
            uint256 currentId = batchIds[i];
            allBatches[i] = batches[currentId];
        }

        return allBatches;
    }
}

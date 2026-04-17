// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./AccessControl.sol";
import "./SignatureValidator.sol";

contract ProductTracker is AccessControl, SignatureValidator {
    enum BizStep {
        HARVESTING,
        PACKING,
        SHIPPING,
        RECEIVING
    }

    struct Product {
        string gtin;
        string lotNumber;
        string productName;
        address owner;
    }

    struct TraceEvent {
        uint256 eventId;
        string gtin;
        string lotNumber;
        BizStep bizStep;
        string locationGLN;
        uint256 timestamp;
        address actor;
        bytes32 dataHash;
    }

    uint256 public eventCounter;
    mapping(bytes32 => Product) public products;
    mapping(bytes32 => TraceEvent[]) public productEvents;

    event ProductCreated(string gtin, string lot, address actor);

    event TraceEventAdded(
        uint256 eventId,
        string gtin,
        string lot,
        BizStep bizStep
    );

    function createProduct(
        string memory _gtin,
        string memory _lot,
        string memory _productName,
        bytes32 _dataHash,
        bytes memory _signature
    ) public onlyGrower {
        bytes32 messageHash = keccak256(
            abi.encodePacked(_gtin, _lot, _productName, _dataHash)
        );
        require(
            _verifySignature(msg.sender, messageHash, _signature),
            "Invalid signature"
        );

        bytes32 key = keccak256(abi.encodePacked(_gtin, _lot));
        require(products[key].owner == address(0), "Product already exist");

        products[key] = Product({
            gtin: _gtin,
            lotNumber: _lot,
            productName: _productName,
            owner: msg.sender
        });

        eventCounter++;

        string memory locationGLN = glnOf[msg.sender];
        productEvents[key].push(
            TraceEvent({
                eventId: eventCounter,
                gtin: _gtin,
                lotNumber: _lot,
                bizStep: BizStep.HARVESTING,
                locationGLN: locationGLN,
                timestamp: block.timestamp,
                actor: msg.sender,
                dataHash: _dataHash
            })
        );

        emit ProductCreated(_gtin, _lot, msg.sender);
    }

    function addTraceEvent(
        string memory _gtin,
        string memory _lot,
        BizStep _bizStep,
        bytes32 _dataHash,
        bytes memory _signature
    ) public onlyActor {
        bytes32 messageHash = keccak256(
            abi.encodePacked(_gtin, _lot, _bizStep, _dataHash)
        );
        require(
            _verifySignature(msg.sender, messageHash, _signature),
            "Invalid signature"
        );

        bytes32 key = keccak256(abi.encodePacked(_gtin, _lot));
        require(products[key].owner != address(0), "Product not found");

        if (_bizStep == BizStep.RECEIVING) {
            products[key].owner = msg.sender;
        }

        eventCounter++;

        string memory locationGLN = glnOf[msg.sender];
        productEvents[key].push(
            TraceEvent({
                eventId: eventCounter,
                gtin: _gtin,
                lotNumber: _lot,
                bizStep: _bizStep,
                locationGLN: locationGLN,
                timestamp: block.timestamp,
                actor: msg.sender,
                dataHash: _dataHash
            })
        );

        emit TraceEventAdded(eventCounter, _gtin, _lot, _bizStep);
    }

    function getProductHistory(
        string memory _gtin,
        string memory _lot
    ) public view returns (TraceEvent[] memory) {
        bytes32 key = keccak256(abi.encodePacked(_gtin, _lot));
        return productEvents[key];
    }
}

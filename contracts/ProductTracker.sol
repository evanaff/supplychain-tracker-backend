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
        bytes32 productId; // hash dari GTIN + lot number
        address owner;
        bytes32 dataHash;
    }

    struct TraceEvent {
        uint256 eventId;
        bytes32 productId; // hash dari GTIN + lot number
        BizStep bizStep;
        string locationGLN;
        uint256 timestamp;
        address actor;
        bytes32 dataHash;
    }

    uint256 public eventCounter;
    mapping(bytes32 => Product) public products;
    mapping(bytes32 => TraceEvent[]) public productEvents;

    event ProductCreated(bytes32 productId, address actor);

    event TraceEventAdded(uint256 eventId, bytes32 productId, BizStep bizStep);

    function createProduct(
        bytes32 _productId,
        bytes32 _dataHash,
        bytes memory _signature
    ) public onlyGrower {
        bytes32 messageHash = keccak256(
            abi.encodePacked(_productId, _dataHash)
        );
        require(
            _verifySignature(msg.sender, messageHash, _signature),
            "Invalid signature"
        );

        require(
            products[_productId].owner == address(0),
            "Product already exist"
        );

        products[_productId] = Product({
            productId: _productId,
            owner: msg.sender,
            dataHash: _dataHash
        });

        eventCounter++;

        string memory locationGLN = glnOf[msg.sender];
        productEvents[_productId].push(
            TraceEvent({
                eventId: eventCounter,
                productId: _productId,
                bizStep: BizStep.HARVESTING,
                locationGLN: locationGLN,
                timestamp: block.timestamp,
                actor: msg.sender,
                dataHash: _dataHash
            })
        );

        emit ProductCreated(_productId, msg.sender);
    }

    function addTraceEvent(
        bytes32 _productId,
        BizStep _bizStep,
        bytes32 _dataHash,
        bytes memory _signature
    ) public onlyActor {
        bytes32 messageHash = keccak256(
            abi.encodePacked(_productId, _bizStep, _dataHash)
        );
        require(
            _verifySignature(msg.sender, messageHash, _signature),
            "Invalid signature"
        );

        require(products[_productId].owner != address(0), "Product not found");

        if (_bizStep == BizStep.RECEIVING) {
            products[_productId].owner = msg.sender;
        }

        eventCounter++;

        string memory locationGLN = glnOf[msg.sender];
        productEvents[_productId].push(
            TraceEvent({
                eventId: eventCounter,
                productId: _productId,
                bizStep: _bizStep,
                locationGLN: locationGLN,
                timestamp: block.timestamp,
                actor: msg.sender,
                dataHash: _dataHash
            })
        );

        emit TraceEventAdded(eventCounter, _productId, _bizStep);
    }

    function getProductHistory(
        bytes32 _productId
    ) public view returns (TraceEvent[] memory) {
        return productEvents[_productId];
    }
}

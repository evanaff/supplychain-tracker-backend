// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./AccessControl.sol";
import "./SignatureValidator.sol";

contract SupplyChainTracker is AccessControl, SignatureValidator {
    struct ProductEvent {
        string productEventId;
        bytes32 dataHash;
    }

    mapping(string => ProductEvent) public productEvents;
    mapping(string => string[]) private productLotEventIds;

    function addProductEvent(
        string memory _productEventId,
        string memory _productLotId,
        bytes32 _dataHash,
        bytes memory _signature
    ) public onlyActor {
        require(
            bytes(productEvents[_productEventId].productEventId).length == 0,
            "Product event already exists"
        );

        address actor = msg.sender;

        bytes32 messageHash = keccak256(
            abi.encode(_productEventId, _productLotId, actor, _dataHash)
        );
        require(
            _verifySignature(actor, messageHash, _signature),
            "Invalid signature"
        );

        productEvents[_productEventId] = ProductEvent({
            productEventId: _productEventId,
            dataHash: _dataHash
        });

        productLotEventIds[_productLotId].push(_productEventId);
    }

    function getProductEventIdsByProductLotId(string memory _productLotId) public view returns (string[] memory) {
        return productLotEventIds[_productLotId];
    }
}

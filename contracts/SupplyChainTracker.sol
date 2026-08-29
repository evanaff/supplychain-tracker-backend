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

    function addProductEvent(
        string memory productEventId,
        bytes32 _dataHash,
        bytes memory _signature
    ) public onlyActor {
        require(
            bytes(productEvents[productEventId].productEventId).length == 0,
            "Product event already exists"
        );

        address actor = msg.sender;

        bytes32 messageHash = keccak256(
            abi.encode(productEventId, actor, _dataHash)
        );
        require(
            _verifySignature(actor, messageHash, _signature),
            "Invalid signature"
        );

        productEvents[productEventId] = ProductEvent({
            productEventId: productEventId,
            dataHash: _dataHash
        });
    }

    function getProductEventById(
        string memory productEventId
    ) public view returns (ProductEvent memory) {
        return productEvents[productEventId];
    }
}

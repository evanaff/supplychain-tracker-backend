// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./AccessControl.sol";

contract SupplyChainTracker is AccessControl {
    struct ProductEvent {
        string productEventId;
        bytes32 dataHash;
    }

    mapping(string => ProductEvent) public productEvents;
    mapping(string => string[]) private productLotEventIds;

    function addProductEvent(
        string memory _productEventId,
        string memory _productLotId,
        bytes32 _dataHash
    ) public onlyActor {
        require(
            bytes(productEvents[_productEventId].productEventId).length == 0,
            "Product event already exists"
        );

        productEvents[_productEventId] = ProductEvent({
            productEventId: _productEventId,
            dataHash: _dataHash
        });

        productLotEventIds[_productLotId].push(_productEventId);
    }

    function getProductEventIdsByProductLotId(
        string memory _productLotId
    ) public view returns (string[] memory) {
        return productLotEventIds[_productLotId];
    }
}

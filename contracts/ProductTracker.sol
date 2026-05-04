// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./AccessControl.sol";
import "./SignatureValidator.sol";

contract ProductTracker is AccessControl, SignatureValidator {
    struct TraceEvent {
        uint256 productId;
        uint256 eventId;
        address actor;
        bytes32 dataHash;
    }

    mapping(uint256 => TraceEvent) public events;
    mapping(uint256 => uint256[]) public productEventIds;

    function addTraceEvent(
        uint256 _eventId,
        uint256 _productId,
        address _actor,
        bytes32 _dataHash,
        bytes memory _signature
    ) public authorizeAccess {
        bytes32 messageHash = keccak256(
            abi.encode(_eventId, _productId, _actor, _dataHash)
        );
        require(
            _verifySignature(_actor, messageHash, _signature),
            "Invalid signature"
        );

        events[_eventId] = TraceEvent({
            productId: _productId,
            eventId: _eventId,
            actor: _actor,
            dataHash: _dataHash
        });

        productEventIds[_productId].push(
            _eventId
        );
    }

    function getProductHistory(
        uint256 _productId
    ) public view returns (TraceEvent[] memory) {
        uint256[] memory ids = productEventIds[_productId];
        TraceEvent[] memory result = new TraceEvent[](ids.length);

        for (uint i = 0; i < ids.length; i++) {
            result[i] = events[ids[i]];
        }

        return result;
    }

    function getProductEvent(
        uint256 _eventId
    ) public view returns (TraceEvent memory) {
        return events[_eventId];
    }
}
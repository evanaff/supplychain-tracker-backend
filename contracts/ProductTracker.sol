// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./AccessControl.sol";
import "./SignatureValidator.sol";

contract ProductTracker is AccessControl, SignatureValidator {
    struct TraceEvent {
        string traceEventId;
        string traceProductId;
        address actor;
        bytes32 dataHash;
    }

    mapping(string => TraceEvent) public traceEvents;
    mapping(string => string[]) public traceEventIds;

    function addTraceEvent(
        string memory _traceEventId,
        string memory _traceProductId,
        address _actor,
        bytes32 _dataHash,
        bytes memory _signature
    ) public authorizeAccess {
        bytes32 messageHash = keccak256(
            abi.encode(_traceEventId, _traceProductId, _actor, _dataHash)
        );
        require(
            _verifySignature(_actor, messageHash, _signature),
            "Invalid signature"
        );

        traceEvents[_traceEventId] = TraceEvent({
            traceProductId: _traceProductId,
            traceEventId: _traceEventId,
            actor: _actor,
            dataHash: _dataHash
        });

        traceEventIds[_traceProductId].push(
            _traceEventId
        );
    }

    function getProductHistory(
        string memory _traceProductId
    ) public view returns (TraceEvent[] memory) {
        string[] memory ids = traceEventIds[_traceProductId];
        TraceEvent[] memory result = new TraceEvent[](ids.length);

        for (uint i = 0; i < ids.length; i++) {
            result[i] = traceEvents[ids[i]];
        }

        return result;
    }

    function getProductEvent(
        string memory _traceEventId
    ) public view returns (TraceEvent memory) {
        return traceEvents[_traceEventId];
    }
}
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./AccessControl.sol";
import "./SignatureValidator.sol";

contract ProductTracker is AccessControl, SignatureValidator {
    struct TraceEvent {
        uint256 traceEventId;
        uint256 traceProductId;
        address actor;
        bytes32 dataHash;
    }

    mapping(uint256 => TraceEvent) public traceEvents;
    mapping(uint256 => uint256[]) public traceEventIds;

    function addTraceEvent(
        uint256 _traceEventId,
        uint256 _traceProductId,
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
        uint256 _traceProductId
    ) public view returns (TraceEvent[] memory) {
        uint256[] memory ids = traceEventIds[_traceProductId];
        TraceEvent[] memory result = new TraceEvent[](ids.length);

        for (uint i = 0; i < ids.length; i++) {
            result[i] = traceEvents[ids[i]];
        }

        return result;
    }

    function getProductEvent(
        uint256 _traceEventId
    ) public view returns (TraceEvent memory) {
        return traceEvents[_traceEventId];
    }
}
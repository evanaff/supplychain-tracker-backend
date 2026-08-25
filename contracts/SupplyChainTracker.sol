// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./AccessControl.sol";
import "./SignatureValidator.sol";

contract SupplyChainTracker is AccessControl, SignatureValidator {
    struct TraceEvent {
        string traceEventId;
        bytes32 dataHash;
    }

    mapping(string => TraceEvent) public traceEvents;

    function addTraceEvent(
        string memory _traceEventId,
        bytes32 _dataHash,
        bytes memory _signature
    ) public onlyActor {
        require(
            bytes(traceEvents[_traceEventId].traceEventId).length == 0,
            "Trace event already exists"
        );

        address actor = msg.sender;

        bytes32 messageHash = keccak256(
            abi.encode(_traceEventId, actor, _dataHash)
        );
        require(
            _verifySignature(actor, messageHash, _signature),
            "Invalid signature"
        );

        traceEvents[_traceEventId] = TraceEvent({
            traceEventId: _traceEventId,
            dataHash: _dataHash
        });
    }

    function getTraceEventById(
        string memory _traceEventId
    ) public view returns (TraceEvent memory) {
        return traceEvents[_traceEventId];
    }
}

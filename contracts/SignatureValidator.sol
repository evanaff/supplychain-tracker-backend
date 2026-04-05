// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract SignatureValidator {
    function _verifySignature(address _signer, bytes32 _messageHash, bytes memory _signature) internal pure returns (bool) {
        bytes32 ethSignedMessageHash = _getEthSignedMessageHash(_messageHash);

        return _recoverSigner(ethSignedMessageHash, _signature) == _signer;
    }

    function _getEthSignedMessageHash(bytes32 _messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    function _recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function _splitSignature(bytes memory _signature) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(_signature.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
    }
}
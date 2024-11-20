// Permit2App.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPermit2, IAllowanceTransfer, ISignatureTransfer} from "../libs/permit2/src/interfaces/IPermit2.sol";

contract Permit2App {
    string constant WITNESS_TYPE_STRING =
        "Witness witness)TokenPermissions(address token,uint256 amount)Witness(address user)";

    bytes32 constant WITNESS_TYPEHASH = keccak256("Witness(address user)");

    IPermit2 public immutable permit2;

    struct Witness {
        address user;
    }

    error InvalidSpender();

    constructor(address _permit2) {
        permit2 = IPermit2(_permit2);
    }

    // Allowance Transfer when permit has not yet been called
    // or needs to be refreshed.
    function allowanceTransferWithPermit(
        IAllowanceTransfer.PermitSingle calldata permitSingle,
        bytes calldata signature,
        uint160 amount
    ) public {
        _permitWithPermit2(permitSingle, signature);
        _receiveUserTokens(permitSingle.details.token, amount);
    }

    /**
     * Allowance Transfer when permit has already been called
     * and isn't expired and within allowed amount.
     * Note: `permit2._transfer()` performs
     * all the necessary security checks to ensure
     * the allowance mapping for the spender
     * is not expired and within allowed amount.
     */
    function allowanceTransferWithoutPermit(
        address token,
        uint160 amount
    ) public {
        _receiveUserTokens(token, amount);
    }

    // Helper function that calls `permit2.permit()`
    function _permitWithPermit2(
        IAllowanceTransfer.PermitSingle calldata permitSingle,
        bytes calldata signature
    ) internal {
        // This contract must have spending permissions for the user.
        if (permitSingle.spender != address(this)) revert InvalidSpender();

        // owner is explicitly msg.sender
        permit2.permit(msg.sender, permitSingle, signature);
    }

    // Helper function that calls `permit2.transferFrom()`
    // Transfers the allowed tokens from user to spender (our contract)
    function _receiveUserTokens(address token, uint160 amount) internal {
        permit2.transferFrom(msg.sender, address(this), amount, token);
    }

    function signatureTransfer(
        address token,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) public {
        permit2.permitTransferFrom(
            // The permit message. Spender is the caller (this contract)
            ISignatureTransfer.PermitTransferFrom({
                permitted: ISignatureTransfer.TokenPermissions({
                    token: token,
                    amount: amount
                }),
                nonce: nonce,
                deadline: deadline
            }),
            ISignatureTransfer.SignatureTransferDetails({
                to: address(this),
                requestedAmount: amount
            }),
            msg.sender, // The owner of the tokens has to be the signer
            signature // The resulting signature from signing hash of permit data per EIP-712 standards
        );
    }

    // SignatureTransfer technique with extra witness data
    function signatureTransferWithWitness(
        address token,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        address user, // example extra witness data
        bytes calldata signature
    ) public {
        bytes32 witness = keccak256(
            abi.encode(WITNESS_TYPEHASH, Witness(user))
        );

        permit2.permitWitnessTransferFrom(
            ISignatureTransfer.PermitTransferFrom({
                permitted: ISignatureTransfer.TokenPermissions({
                    token: token,
                    amount: amount
                }),
                nonce: nonce,
                deadline: deadline
            }),
            ISignatureTransfer.SignatureTransferDetails({
                to: address(this),
                requestedAmount: amount
            }),
            msg.sender, // The owner of the tokens has to be the signer
            witness, // Extra data to include when checking the signature
            WITNESS_TYPE_STRING, // EIP-712 type definition for REMAINING string stub of the typehash
            signature // The resulting signature from signing hash of permit data per EIP-712 standards
        );
    }
}

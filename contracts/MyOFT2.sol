// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {Origin, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {OFT} from "@layerzerolabs/oft-evm/contracts/OFT.sol";

contract MyOFT2 is OFT {
    modifier onlySelf() {
        require(msg.sender == address(this), "Only self");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) Ownable(_delegate) {}

    function mint(address _to, uint256 _amount) public onlySelf {
        _credit(_to, _amount, 0);
    }

    function burn(
        address _to,
        uint256 _amount,
        uint256 _minAmount,
        uint32 _eid
    ) public onlySelf {
        _debit(_to, _amount, _minAmount, _eid);
    }

    function transfer(
        address _from,
        address _to,
        uint256 _amount
    ) public onlySelf {
        _transfer(_from, _to, _amount);
    }

    function quote(
        uint32 _dstEid,
        bytes calldata _data,
        bytes memory _options,
        bool _payInLzToken
    ) public view returns (MessagingFee memory fee) {
        bytes memory _payload = abi.encode(_data);

        return super._quote(_dstEid, _payload, _options, _payInLzToken);
    }

    function sendMessage(
        uint32 _dstEid,
        bytes memory _payload,
        bytes calldata _options
    ) external payable {
        _lzSend(
            _dstEid,
            _payload,
            _options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
    }

    function sendMint(
        uint32 _dstEid,
        address _to,
        uint256 _amount,
        bytes calldata _options
    ) external payable {
        bytes memory _payload = abi.encodeWithSignature(
            "mint(address,uint256)",
            _to,
            _amount
        );

        _lzSend(
            _dstEid,
            _payload,
            _options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
    }

    function sendBurn(
        uint32 _dstEid,
        address _to,
        uint256 _amount,
        uint256 _minAmount,
        bytes calldata _options
    ) external payable {
        bytes memory _payload = abi.encodeWithSignature(
            "burn(address,uint256,uint256,uint32)",
            _to,
            _amount,
            _minAmount,
            _dstEid
        );

        _lzSend(
            _dstEid,
            _payload,
            _options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
    }

    function sendTransfer(
        uint32 _dstEid,
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata _options
    ) external payable {
        bytes memory _payload = abi.encodeWithSignature(
            "transfer(address,address,uint256)",
            _from,
            _to,
            _amount
        );

        _lzSend(
            _dstEid,
            _payload,
            _options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata payload,
        address,
        bytes calldata
    ) internal override {
        (bool success, ) = address(this).call(payload);
        require(success, "Transaction failed");
    }
}

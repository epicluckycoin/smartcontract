pragma solidity ^0.4.18;


contract ERC677Receiver {
    function tokenFallback(address _sender, uint _value, bytes _data) public returns (bool);
}
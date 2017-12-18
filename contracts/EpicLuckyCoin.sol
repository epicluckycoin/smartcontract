pragma solidity ^0.4.18;

import './SafeMath.sol';

//Interface declaration from: https://github.com/ethereum/eips/issues/20
contract ERC20Interface {
    //from: https://github.com/OpenZeppelin/zeppelin-solidity/blob/b395b06b65ce35cac155c13d01ab3fc9d42c5cfb/contracts/token/ERC20Basic.sol
    uint256 public totalSupply; //tokens that can vote, transfer, receive dividend
    function balanceOf(address who) public constant returns (uint256);
    function transfer(address to, uint256 value) public returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    //from: https://github.com/OpenZeppelin/zeppelin-solidity/blob/b395b06b65ce35cac155c13d01ab3fc9d42c5cfb/contracts/token/ERC20.sol
    function allowance(address owner, address spender) public constant returns (uint256);
    function transferFrom(address from, address to, uint256 value) public returns (bool);
    function approve(address spender, uint256 value) public returns (bool);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract EpicLuckyCoin is ERC20Interface {

    using SafeMath for uint256;

    address public owner;

    mapping(address => uint256) public balances;
    mapping(address => mapping (address => uint256)) public allowed;

    uint256 public constant maxTokens = 10 * 1000 * 1000 * 100;      //max distributable tokens = 10mio times the decimal places

    //as suggested in https://theethereum.wiki/w/index.php/ERC20_Token_Standard
    string public constant name = "Epic Lucky Coin";
    string public constant symbol = "ELC";
    uint8 public constant decimals = 2;

    uint256 public previousValue = 1000;

    event Minted(address _addr, uint256 tokens); //called when a specific address has been minted

    function EpicLuckyCoin() public {
        owner = msg.sender;
        totalSupply = 1000; //from previousValue that is created out of thin air
    }

    /**
     * In case an owner account gets compromised, it should be possible to move control
     * over to another account. This helps in cases like the Parity multisig exploit: As
     * soon as an exploit becomes known, the affected parties might have a small time
     * window before being attacked.
     */
    function transferOwnership(address _newOwner) public {
        require(msg.sender == owner);
        require(_newOwner != address(0));
        owner = _newOwner;
    }

    //*********************** Minting *****************************************
    function mint() public payable {
        //that means, for 1 ethers you get 10000 epic lucky coins (10**14), with 2 decimal places (10**12)
        uint256 value = msg.value.div(10**12);

        //https://ethereum.stackexchange.com/questions/191/how-can-i-securely-generate-a-random-number-in-my-smart-contract
        //not perfect, but gives a weak random number, can be influenced by the miner!
        uint256 rnd = uint256(keccak256(block.timestamp ^ uint256(block.coinbase) ^ uint256(block.blockhash(block.number-1))));
        if(rnd % 2 == 0) {
            value = value.div(2);
        } else {
            value = value.mul(2);
        }
        // https://ethereum.stackexchange.com/questions/2428/does-throw-refund-the-ether-value
        require(totalSupply.add(value) <= maxTokens);
        balances[msg.sender] = balances[msg.sender].add(value);
        totalSupply = totalSupply.add(value);
        Minted(msg.sender, value);
    }

    function payout() public { //to support further lucky coins
        require(msg.sender == owner);
        msg.sender.transfer(this.balance);
    }

    //****************************** ERC20 ************************************
    // // https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/token/StandardToken.sol

    /**
     * @dev Gets the balance of the specified address.
     * @param _owner The address to query the the balance of.
     * @return An uint256 representing the amount owned by the passed address.
     */
    function balanceOf(address _owner) public constant returns (uint256 balance) {
        return balances[_owner];
    }

    /**
     * @dev transfer token for a specified address
     * @param _to The address to transfer to.
     * @param _value The amount to be transferred.
     */
    function transfer(address _to, uint256 _value) public returns (bool) {

        require(_to != address(0));
        require(_value <= balances[msg.sender]);

        // SafeMath.sub will throw if there is not enough balance.
        balances[msg.sender] = balances[msg.sender].sub(_value);

        //since this is a lucky coin, the value transferred is not what you expect
        uint256 val = calcValue(_value);
        balances[_to] = balances[_to].add(val);
        Transfer(msg.sender, _to, val);
        return true;
    }


    /**
     * @dev Transfer tokens from one address to another
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);

        //since this is a lucky coin, the value transferred is not what you expect
        uint256 val = calcValue(_value);
        balances[_to] = balances[_to].add(val);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(val);
        Transfer(_from, _to, val);
        return true;
    }

    function calcValue(uint256 _value) internal returns (uint256) {
        //https://ethereum.stackexchange.com/questions/191/how-can-i-securely-generate-a-random-number-in-my-smart-contract
        //not perfect, but gives a weak random number, can be influenced by the miner!
        uint256 rnd = uint256(keccak256(block.timestamp ^ uint256(block.coinbase) ^ uint256(block.blockhash(block.number-1))));

        if(rnd % 10 == 0) {
            uint256 newValue = previousValue;
            previousValue = _value;
            return newValue;
        } else {
            return _value;
        }
    }

    /**
     * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
     * @param _spender The address which will spend the funds.
     * @param _value The amount of tokens to be spent.
     */
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    /**
     * @dev Function to check the amount of tokens that an owner allowed to a spender.
     * @param _owner address The address which owns the funds.
     * @param _spender address The address which will spend the funds.
     * @return A uint256 specifying the amount of tokens still available for the spender.
     */
    function allowance(address _owner, address _spender) public constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }
}
pragma solidity ^0.4.18;

import './SafeMath.sol';
import './ERC677Receiver.sol';

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

contract ERC223Interface {
    function transferAndCall(address to, uint value, bytes data) public returns (bool success);
    event Transfer(address indexed from, address indexed to, uint value, bytes data);
}

contract EpicLuckyCoin is ERC20Interface, ERC223Interface {

    using SafeMath for uint256;

    address public owner;

    mapping(address => uint256) public balances;
    mapping(address => mapping (address => uint256)) public allowed;

    uint256 public constant maxTokens = 1000 * 1000 * 1000;      //max distributable tokens = 1bn == 1000eth
    //testing
    //uint256 public constant maxTokens = 5 * 1000 * 1000;      //max distributable tokens = 5eth for testing

    //as suggested in https://theethereum.wiki/w/index.php/ERC20_Token_Standard
    string public constant name = "Epic Lucky Coin";
    string public constant symbol = "ELC";
    uint8 public constant decimals = 2;

    uint256 public pot = 0;
    uint256 public constant potIncrease = 10 * 100; //10 ELC * decimals

    address public previousMintAddress = address(0);
    uint256 public previousMintBlockNr = 0;
    uint256 public previousMintValue = 0;

    address public previousTransferAddress = address(0);
    uint256 public previousTransferBlockNr = 0;

    event Minted(address owner, int256 value); //called when a specific address has been minted

    function EpicLuckyCoin() public {
        owner = msg.sender;
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
    function() public payable {
        require(msg.value > 0);
        //that means, for 1 ethers you get 10000 epic lucky coins (10**14), with 2 decimal places (10**12)
        // 10000 * 100 -> 1 eth = 1mio elc-cent
        uint256 value = msg.value.div(10**12);

        luckyTransfer();
        luckyMint();
        previousMintBlockNr = block.number;
        previousMintAddress = msg.sender;
        previousMintValue = value;

        // https://ethereum.stackexchange.com/questions/2428/does-throw-refund-the-ether-value
        require(totalSupply.add(value) <= maxTokens);
        balances[msg.sender] = balances[msg.sender].add(value);
        totalSupply = totalSupply.add(value);
        Minted(msg.sender, int256(value));
    }

    function luckyMint() private {
        if(block.number != previousMintBlockNr && (block.number - previousMintBlockNr) < 256 ) {
            //https://ethereum.stackexchange.com/questions/191/how-can-i-securely-generate-a-random-number-in-my-smart-contract
            //not perfect, but gives a weak random number, can be influenced by the miner!
            //go random for the previous minter!
            uint256 rnd = uint256(keccak256(block.blockhash(previousMintBlockNr)));
            uint256 val = previousMintValue.div(2); // half of the previous payin value
            if(rnd % 2 == 0) { //bad luck!, deduct half of previous value
                if(balances[previousMintAddress] >= val) {
                    balances[previousMintAddress] = balances[previousMintAddress].sub(val);
                } else {
                    val = balances[previousMintAddress];
                    balances[previousMintAddress] = 0;
                }
                totalSupply = totalSupply.sub(val);
                Minted(previousMintAddress, -int256(val));
            } else { //lucky you!, add half
                if(totalSupply.add(val) > maxTokens) {
                    val = maxTokens.sub(totalSupply);
                }
                balances[previousMintAddress] = balances[previousMintAddress].add(val);
                totalSupply = totalSupply.add(val);
                Minted(previousMintAddress, int256(val));
            }
            previousMintBlockNr = 0;
            previousMintAddress = 0;
            previousMintValue = 0;
        }
    }

    function luckyTransfer() private {
        if(block.number != previousTransferBlockNr && (block.number - previousTransferBlockNr) < 256 ) {
            //https://ethereum.stackexchange.com/questions/191/how-can-i-securely-generate-a-random-number-in-my-smart-contract
            //not perfect, but gives a weak random number, can be influenced by the miner!
            //go random for the previous minter!
            uint256 rnd = uint256(keccak256(block.blockhash(previousTransferBlockNr)));
            if(rnd % 200 == 0) { //.5% chance -> reward ~2000Tokens ~0.2ETH, which is way below 5ETH.
                balances[previousTransferAddress] = balances[previousTransferAddress].add(pot);
                Transfer(this, previousTransferAddress, pot);
                //tokens are from pot, thus no tokens are created from thin air
                pot = 0;
                previousTransferBlockNr = 0;
                previousTransferAddress = 0;
            }
        }
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
        require(_value >= potIncrease);

        // SafeMath.sub will throw if there is not enough balance.
        balances[msg.sender] = balances[msg.sender].sub(_value);

        //since this is a lucky coin, the value transferred is not what you expect
        luckyMint();
        luckyTransfer();
        previousTransferBlockNr = block.number;
        previousTransferAddress = msg.sender;

        //in any case add 10*1000 to the pot
        uint256 val = _value.sub(potIncrease);
        pot = pot.add(potIncrease);
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
        require(_value >= potIncrease);

        balances[_from] = balances[_from].sub(_value);

        //since this is a lucky coin, the value transferred is not what you expect
        luckyMint();
        luckyTransfer();
        previousTransferBlockNr = block.number;
        previousTransferAddress = msg.sender;

        //in any case add 10 to the pot
        uint256 val = _value.sub(potIncrease);
        pot = pot.add(potIncrease);
        balances[_to] = balances[_to].add(val);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value); //subtract old value
        Transfer(_from, _to, val);
        return true;
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

    // **************************** ERC677 *****************************
    //from https://github.com/smartcontractkit/LinkToken/blob/master/contracts/ERC677Token.sol

    /**
     * @dev transfer token to a contract address with additional data if the recipient is a contact.
     * @param _to The address to transfer to.
     * @param _value The amount to be transferred.
     * @param _data The extra data to be passed to the receiving contract.
     */
    function transferAndCall(address _to, uint _value, bytes _data) public returns (bool success) {
        bool retVal = transfer(_to, _value);
        require(retVal);
        Transfer(msg.sender, _to, _value, _data);
        if (isContract(_to)) {
            ERC677Receiver receiver = ERC677Receiver(_to);
            return receiver.tokenFallback(msg.sender, _value, _data);
        }
        return true;
    }

    function isContract(address _addr) private view returns (bool hasCode) {
        uint length;
        assembly { length := extcodesize(_addr) }
        return length > 0;
    }
}
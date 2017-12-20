# Epic Lucky Coin (ELC)
An epic lucky coin is a coin where you never know how many tokens you transfer or mint. If 
you get lucky, you may end up with more tokens than before.

## Short Summary
 * Name: Epic Lucky Coin
 * Symbol: ELC
 * Max Tokens: 10'000'000 ELC or 1'000 ETH
 * Exchange Rate: 1 ETH = 10'000 ELC
 * Decimal Points: 2
 * ERC20 + ERC677 standard
 
Here are the rules minting and transferring rules:

## Minting
The exchange rate is 1 ETH = 10'000 ELC, however, with a 50%<sup>*</sup> change you get 20'000 ELC and if 
you are unlucky, you get 5'000 ELC. For the randomness discussion, see below.

## Coin Transfer
If you transfer ELC from Alice to Bob, then with a 1% chance, you will transfer a previous
amount. E.g., if Carol had send Bob 1000 ELC in the past and now Alice sends Bob 10 ELC, then
with a 1% chance, Alice will be deducted 10 ELC, while Bob will received 1000 ELC.  
 
## Why?
This is a fun coin that was invented for a secret santa gift exchange purpose. The goal 
was find a fun coin. Instead of finding a coin, I created a coin. If this coin should ever
become popular, the funds will be used for further fun coins. This coin has many testcases 
and has been rigorously tested, thus, I'm fairly certain that this coin has no major bugs.

## Randomness

Creating strong random values onchain is not possible. However, there are several ways how 
to create weak random values onchain or strong random values offchain.
 
### Weak Random Values
Using data that will be set by the miner, such as the timestamp of a block or the miners
coinbase address could be used as an input for a weak random value. The current blockhash 
cannot be used in that sense as the miner does not know the current blockhash during the 
execution of the smart contract. The only values contributing to the weak randomness is 
the timestamp and the coinbase address as the previous blockhash is known as suggested 
[here](https://ethereum.stackexchange.com/questions/30849/blockhash-used-for-random-number-generation).

```uint256 rnd = uint256(keccak256(block.timestamp ^ uint256(block.coinbase) ^ uint256(block.blockhash(block.number-1))));```

This can be exploited by a miner, as the miner can choose its coinbase address and to a certain
limit the timestamp [900sec](https://github.com/ethereum/wiki/blob/master/Block-Protocol-2.0.md). Thus, 
the randomness is weak and if you rely on this function you should expect miners to set the
value according to an expected outcome. Thus, do not use this for random values unless you 
know what you are doing, as explained (here)[https://www.reddit.com/r/ethereum/comments/483rr1/do_not_use_block_hash_as_source_of_randomness/].

The current blockhash can only be created if all the content from that block
is ready, which will be after running all contracts in the block. One way around is to 
use a second transaction in an other block that will call a function that uses 
the previous unknown blockhash as a random value. However, second transaction has 
to be called withing 256 blocks (~1h), as a smart contract can only access the last 256 
[blockhashes](http://solidity.readthedocs.io/en/develop/units-and-global-variables.html?highlight=global#block-and-transaction-properties).
       
```
pragma solidity ^0.4.18;
contract Rnd {
    uint256 blockNr;
    function rndPhase1() public {
        blockNr = block.number;
    }
    function rndPhase2() public returns (uint256) {
        if(blockNr > 0 && blockNr <= 256) { //phase1 needs to be called
            if(block.number - blockNr > 0) { //not in the same block
                blockNr = 0;
                return uint256(keccak256(block.blockhash(blockNr)));
            }
        }
        return 0;
    }
}
```

This randomness is still weak, but not as weak as the first approach. A miner can still not 
publish a block if the outcome is not in favor. This will give you a small edge over the 
random value that could destroy certain smart contracts.


### Strong Random Values

The randomness is weak in this contract:


If you can guess the random values, you can at most get 2x the coins for your ethers from the
mint() function. In 10% of the cases in the transfer functions, you get coins from a previous 
transaction. If you can guess the random number, you can claim the coins from your 
predecessor, but you cannot create tokens out of thin air. 

Still, its difficult to predict the random number, as the block.timestamp is difficult to predict while 
the coinbase has a certain probability according to the mining power.
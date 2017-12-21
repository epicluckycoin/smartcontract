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
The exchange rate is 1 ETH = 10'000 ELC, however, with a 50%<sup>*</sup> change you get 
50% more and if you are unlucky, you get 50% less. E.g. if you buy/mint 1 ETH, you may 
get 15'000 or 5'000 ELC. For the randomness discussion, see below.

## Coin Transfer
If you transfer ELC from Alice to Bob, then with a 0.5% chance, you will transfer the pot 
in addition. For every transaction 10 ELC coins goes to a pot, and it is expected that 
every 0.5%, 2'000 ELC will be added to the a random transfer. E.g., if Alice sends 1000 ELC 
to Bob, Alice will have 1'000 less, and Bob receives 990. However, with a 0.5% chance, 
Bob will receive 2990 tokens instead only 990 tokens. For the randomness discussion, 
see below.
 
## Why?
We are a team of blockchain developers that implemented this coin for a secret santa gift 
exchange. However, we believe its a fun coin to play with! You never know what happens in
the crpyto world, thus, for the moment we'll remain anonymous as we have customers from 
the "old" economy and such a coin is not something our clients are looking for. Altough you
need to have luck to get more coins, this coin has many testcases and has been rigorously 
tested, so it should behave as expected.

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
publish a block if the outcome is not in favor. This will give you a small edge 
(e.g., intead of 50/50 you'll get 50.1/49.9) over the random value that could destroy 
certain smart contracts.

If your contract uses the first approach, you can expect a miner to set a random value. Thus,
your contract needs to cope with 100/0. An example could be a card playing game for fun without
the involvent of assets (playing for fun).

If you use the second approach, the miner can influence the random value in a sense, that it
might drop a block. Thus, many suggest that the payoff needs to be smaller than 5ETH that
a miner would get when publishing the block. Thus, your contract needs to cope with something
like 50.1/49.9. 

One idea was to add or deduct 50% for each transfer, but with no upper limit, and a small
edge over the random value means that a rogue miner can create coins out of thin air, and
your contract is broken.

This contract exploits the weak randomness of future blockhashes. The minting is bound to
wei, so even if a miner gets 50.1/49.9, then the miner has a slightly better exchange rate of
a bit adove 1:10'000 ELC. During the transfer, you can get a pot, which has on average the
value of 0.2 ETH, which is way below the 5 ETH a miner would get. However, there is a worst
case, where for a long period of time every transaction is more than 1h apart. Then the pot
will be larger. However, we don't believe it will reach 5ETH as otherwise, many transaction
are necessary.    


### Strong Random Values

Oracle, commitment schemes (semi-strong)
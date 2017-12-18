# Epic Lucky Coin (ELC)
An epic lucky coin is a coin that is not particularly useful for transferring tokens, 
as you never know how many tokens you transfer. 

However, if you get lucky, you may end up with more tokens than before. Here are the rules

## Minting

The exchange rate is 1 ETH = 10'000 ELC, however, with a 50% change you get 20'000 ELC and if you
are unlucky, you get 5'000 ELC

## Coin Transfer

If you transfer ELC from Alice to Bob, then with a 10% chance, you will transfer a previous
amount. E.g., if Carol had send Bob 1000 ELC in the past and now Alice sends Bob 10 ELC, then
with a 10% chance, Alice will be deducted 10 ELC, while Bob will received 1000 ELC.  

## Short Summary
 * Name: Epic Lucky Coin
 * Symbol: ELC
 * Max Tokens: 10'000'000
 * Decimal Points: 2
 * Exchange Rate: 1 ETH = 10'000 ELC
 * ERC20 standard
 
## Limitations
The value in both transfer methods are not what you expect. In 10% of the cases the value
is a value from a previous transfer - completely unusable. For minting, you may end up with
twice as much tokens (or halve).

## Caution
This is a fun coin, that was invented for a secret santa gift exchange purpose. The goal 
was find a useless coin. Since this coin is useless in reliable transferring values, its 
still fun to see your transferred funds double (or halve). This coin has many testcases and 
has been rigorously tested, thus, I'm fairly certain that this coin is bug free.

## Randomness
The randomness is weak in this contract:

```uint256 rnd = uint256(keccak256(block.timestamp ^ uint256(block.coinbase) ^ uint256(block.blockhash(block.number-1))));```

If you can guess the random values, you can at most get 2x the coins for your ethers from the
mint() function. In 10% of the cases in the transfer functions, you get coins from a previous 
transaction. If you can guess the random number, you can claim the coins from your 
predecessor, but you cannot create tokens out of thin air. 

Still, its difficult to predict the random number, as the block.timestamp is difficult to predict while 
the coinbase has a certain probability according to the mining power.
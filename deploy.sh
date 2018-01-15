#!/bin/bash

solc --optimize --bin contracts/EpicLuckyCoin.sol > contract.bin
solc --optimize --abi contracts/EpicLuckyCoin.sol > contract.abi



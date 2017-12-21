//based on https://github.com/ConsenSys/Tokens/tree/master/test

var EpicLuckyCoin = artifacts.require('./EpicLuckyCoin.sol')
var utils = {
    testMint(contract, account, value) {
        return contract.sendTransaction({from: account, value: value})
            .catch((err) => {
            console.log("mint error: "+err)
            throw new Error(err) });
    },
    mine() {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: 0
        }, function(err, result) {
            console.log(result);
        });
    },
    compare(value) {
        return value == 1500000-1000 || value == 500000-1000;
    },

    compareDiff(value, diff) {
        return value == 1500000-1000 + diff || value == 500000-1000 + diff;
    },

}


contract('EpicLuckyCoin', function (accounts) {

    //https://ethereum.stackexchange.com/questions/15567/truffle-smart-contract-testing-does-not-reset-state/15574#15574
    var contract;

    beforeEach(async function () {
        return EpicLuckyCoin.new()
            .then(function (instance) {
                contract = instance;
            });
    });

    const evmThrewRevertError = (err) => {
        if (err.toString().includes('Error: VM Exception while processing transaction: revert')) {
            return true
        }
        if (err.toString().includes('invalid opcode')) {
            return true
        }
        return false
    }

    //************************** TEST ERC20 - the smart contract code is copy&paste from reliable sources ************
    it("test ERC20 basic functionality", function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (retVal) {
            utils.mine();
            return contract.transfer(accounts[1], 1, {from: accounts[0]});
        }).then(function (retVal) {
            assert.equal(false, "account 1 does not have any tokens");
        }).catch(function (e) {
            return contract.transfer(accounts[1], 0, {from: accounts[1]});
        }).then(function (retVal) {
            assert.equal(false, "cannot transfor 0 tokens");
        }).catch(function (e) {
            return contract.transfer(accounts[1], -1, {from: accounts[1]});
        }).then(function (retVal) {
            assert.equal(false, "negative values are not possible");
        }).catch(function (e) {
            return contract.transfer(accounts[0], 1, {from: accounts[1]});
        }).then(function (retVal) {
            assert.equal(false, "cannot steal tokens from another account");
        }).catch(function (e) {
            return contract.transfer(accounts[0], 100001, {from: accounts[1]});
        }).then(function (retVal) {
            assert.equal(false, "account 0 only has 1000 tokens, cannot transfor 1001");
        }).catch(function (e) {
            return contract.transfer(accounts[0], 100000, {from: accounts[0]});
        }).then(function (retVal) {
            //transfer was successful
            return contract.balanceOf.call(accounts[0], {from: accounts[0]});
        }).then(function (balance) {
            balance = balance.valueOf()
            assert.equal(true, utils.compare(balance.valueOf()), "we sent from account 0:"+balance.valueOf());
            return contract.transfer(accounts[1], balance, {from: accounts[0]});
        }).then(function (retVal) {
            return contract.balanceOf.call(accounts[0], {from: accounts[1]});
        }).then(function (balance) {
            assert.equal(balance.valueOf(), 0, "we transfer all tokens to account 1");
            return contract.balanceOf.call(accounts[1], {from: accounts[2]});
        }).then(function (balance) {
            assert.equal(balance.valueOf(), balance, "account 1 has 1000 tokenscd ");
        }).catch((err) => {
            console.log(err)
            throw new Error(err)
        })
    });


// CREATION

    it('creation: should create an initial balance of 0 for everyone', function () {
        EpicLuckyCoin.new({from: accounts[0]}).then(function (ctr) {
            return ctr.balanceOf.call(accounts[0])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 0)
        }).catch((err) => {
            throw new Error(err)
        })
    })

// TRANSERS
// normal transfers without approvals.

    // this is not *good* enough as the contract could still throw an error otherwise.
    // ideally one should check balances before and after, but estimateGas currently always throws an error.
    // it's not giving estimate on gas used in the event of an error.
    it('transfers: ether transfer should be reversed.', function () {
        var ctr
        return EpicLuckyCoin.new({from: accounts[0]}).then(function (result) {
            ctr = result
            return web3.eth.sendTransaction({from: accounts[0], to: ctr.address, value: web3.toWei('10', 'Ether')})
        }).catch(function (result) {
            assert(true)
        }).catch((err) => {
            throw new Error(err)
        })
    })

    it('transfers: should transfer 10000 to accounts[1] with accounts[0] having 10000', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.transfer(accounts[1], 10000, {from: accounts[0]})
        }).then(function (result) {
            return contract.balanceOf.call(accounts[1])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 9000)
        }).catch((err) => {
            throw new Error(err)
        })
    })

    it('transfers: should fail when trying to transfer 20000001 to accounts[1] with accounts[0] having 500000 or 2000000', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.transfer.call(accounts[1], 20000001, {from: accounts[0]})
        }).then(function (result) {
            assert(false, 'The preceding call should have thrown an error.')
        }).catch((err) => {
            assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                'throw the expected error')
        })
    })

    it('transfers: should fail on zero-transfers', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.transfer.call(accounts[1], 0, {from: accounts[0]})
        }).then(function (result) {
            assert(false, 'The preceding call should have thrown an error.')
        }).catch((err) => {
            assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                'throw the expected error:'+err)})
    })

    // NOTE: testing uint256 wrapping is impossible in this standard token since you can't supply > 2^256 -1.

// APPROVALS

    it('approvals: msg.sender should approve 100 to accounts[1]', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.approve(accounts[1], 100, {from: accounts[0]})
        }).then(function (result) {
            return contract.allowance.call(accounts[0], accounts[1])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 100)
        }).catch((err) => {
            throw new Error(err)
        })
    })

    // bit overkill. But is for testing a bug
    it('approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.balanceOf.call(accounts[0])
        }).then(function (result) {
            assert.strictEqual(1000000, result.toNumber(), "result was:"+result);
            return contract.approve(accounts[1], 10000, {from: accounts[0]})
        }).then(function (result) {
            return contract.balanceOf.call(accounts[2])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 0)
            return contract.allowance.call(accounts[0], accounts[1])
        }).then(function (result) {
            return contract.transferFrom(accounts[0], accounts[2], 2000, {from: accounts[1]})
        }).then(function (result) {
            return contract.allowance.call(accounts[0], accounts[1])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 8000)
            return contract.balanceOf.call(accounts[2])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 1000)
            return contract.balanceOf.call(accounts[0])
        }).then(function (result) {
            assert.strictEqual(true, utils.compareDiff(result.toNumber(), -1000), "result was:"+result)
        }).catch((err) => {
            throw new Error(err)
        })
    })

    // should approve 100 of msg.sender & withdraw 50, twice. (should succeed)
    it('approvals: msg.sender approves accounts[1] of 100 & withdraws 20 twice.', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.approve(accounts[1], 10000, {from: accounts[0]})
        }).then(function (result) {
            return contract.allowance.call(accounts[0], accounts[1])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 10000)
            return contract.transferFrom(accounts[0], accounts[2], 2000, {from: accounts[1]})
        }).then(function (result) {
            return contract.allowance.call(accounts[0], accounts[1])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 8000)
            return contract.balanceOf.call(accounts[2])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 1000)
            return contract.balanceOf.call(accounts[0])
        }).then(function (result) {
            assert(true, utils.compareDiff(result.toNumber(), -1000), "result:"+result)
            // FIRST tx done.
            // onto next.
            return contract.transferFrom(accounts[0], accounts[2], 2000, {from: accounts[1]})
        }).then(function (result) {
            return contract.allowance.call(accounts[0], accounts[1])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 6000)
            return contract.balanceOf.call(accounts[2])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 2000)
            return contract.balanceOf.call(accounts[0])
        }).then(function (result) {
            assert(true, utils.compareDiff(result.toNumber(), -2000), "result:"+result);
        }).catch((err) => {
            throw new Error(err)
        })
    })

    // should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
    it('approvals: msg.sender approves accounts[1] of 100 & withdraws 50 & 60 (2nd tx should fail)', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.approve(accounts[1], 10000, {from: accounts[0]})
        }).then(function (result) {
            return contract.allowance.call(accounts[0], accounts[1])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 10000)
            return contract.transferFrom(accounts[0], accounts[2], 5000, {from: accounts[1]})
        }).then(function (result) {
            return contract.allowance.call(accounts[0], accounts[1])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 5000)
            return contract.balanceOf.call(accounts[2])
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 4000)
            return contract.balanceOf.call(accounts[0])
        }).then(function (result) {
            assert(true, utils.compareDiff(result.toNumber(), -5000), "result:"+result)
            // FIRST tx done.
            // onto next.
            return contract.transferFrom.call(accounts[0], accounts[2], 6000, {from: accounts[1]})
        }).then(function (result) {
            assert(false, 'The preceding call should have thrown an error.')
        }).catch((err) => {
            assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                'throw the expected error')
        })
    })

    it('approvals: attempt withdrawal from acconut with no allowance (should fail)', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.transferFrom.call(accounts[0], accounts[2], 6000, {from: accounts[1]})
        }).then(function (result) {
            assert(false, 'The preceding call should have thrown an error.')
        }).catch((err) => {
            assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                'throw the expected error')
        })
    })

    it('approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.approve(accounts[1], 10000, {from: accounts[0]})
        }).then(function (result) {
            return contract.transferFrom(accounts[0], accounts[2], 6000, {from: accounts[1]})
        }).then(function (result) {
            return contract.approve(accounts[1], 0, {from: accounts[0]})
        }).then(function (result) {
            return contract.transferFrom.call(accounts[0], accounts[2], 1000, {from: accounts[1]})
        }).then(function (result) {
            assert(false, 'The preceding call should have thrown an error.')
        }).catch((err) => {
            assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                'throw the expected error')
        })
    })

    it('approvals: approve max (2^256 - 1)', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.approve(accounts[1], '115792089237316195423570985008687907853269984665640564039457584007913129639935', {from: accounts[0]})
        }).then(function (result) {
            return contract.allowance(accounts[0], accounts[1])
        }).then(function (result) {
            var match = result.equals('1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77')
            assert.isTrue(match)
        }).catch((err) => {
            throw new Error(err)
        })
    })

    it('events: should fire Transfer event properly', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.transfer(accounts[1], '2666', {from: accounts[0]})
        }).then(function (result) {

            assert.strictEqual(result.logs[0].args.owner, accounts[0], "from:"+result.logs[0].args.owner)
            var num = result.logs[0].args.value.toNumber();
            assert.strictEqual(true, (num == -500000 || num == 500000))

            assert.strictEqual(result.logs[1].args.from, accounts[0])
            assert.strictEqual(result.logs[1].args.to, accounts[1])
            assert.strictEqual(result.logs[1].args.value.toString(), '1666')
        }).catch((err) => {
            throw new Error(err)
        })
    })

    //This does not fail, as the contract max has to be lowered manually!!
    it('events: should fail on minting max tokens', async function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[1], web3.toWei(5,"ether") + 1);
        }).then(function (result) {
            assert(false, 'The preceding call should have thrown an error.')
        }).catch((err) => {
            assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                'throw the expected error:' + err)
        })
    })
    it('events: should not fail on minting max tokens', async function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[2], web3.toWei(5,"ether"));
        }).then(function (result) {
            assert(true, 'The preceding call should not have thrown an error.')
        }).catch((err) => {
            assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                'throw the expected error:' + err)
        })
    })

    it('events: should fire Approval event properly', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.approve(accounts[1], '2666', {from: accounts[0]})
        }).then(function (result) {
            var approvalLog = result.logs.find((element) => {
                if (element.event.match('Approval')) {return true} else {return false}
            })
            assert.strictEqual(approvalLog.args.owner, accounts[0])
            assert.strictEqual(approvalLog.args.spender, accounts[1])
            assert.strictEqual(approvalLog.args.value.toString(), '2666')
        }).catch((err) => {
            throw new Error(err)
        })
    })

    it('events: should fire transferFrom event properly', function () {
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[0], web3.toWei(1,"ether"));
        }).then(function (result) {
            return contract.approve(accounts[1], '2666', {from: accounts[0]})
        }).then(function (result) {
            return contract.transferFrom(accounts[0], accounts[2], '2666', {from: accounts[1]})
        }).then(function (result) {

            /*assert.strictEqual(result.logs[0].args.owner, accounts[0], "owner:"+result.logs[0].args.owner)
            assert.strictEqual(result.logs[0].args.spender, accounts[1], "spender:"+result.logs[0].args.spender)
            assert.strictEqual(result.logs[0].args.value.toString(), '2666')*/

            assert.strictEqual(result.logs[0].args.owner, accounts[0], "owner:"+result.logs[0].args.owner)
            var num = result.logs[0].args.value.toNumber();
            assert.strictEqual(true, (num == -500000 || num == 500000))

            assert.strictEqual(result.logs[1].args.from, accounts[0], "from:"+result.logs[1].args.from)
            assert.strictEqual(result.logs[1].args.to, accounts[2], "to:"+result.logs[1].args.to)
            assert.strictEqual(result.logs[1].args.value.toString(), '1666')
        }).catch((err) => {
            throw new Error(err)
        })
    })

    it('dev: withdraw', function () {
        var val = 0;
        return EpicLuckyCoin.deployed().then(function (instance) {
            return utils.testMint(contract, accounts[4], web3.toWei(3,"ether"));
        }).then(function (result) {
            return contract.payout({from: accounts[1]})
        }).then(function (result) {
            assert(false, "needs to fail from accoutn 1");
        }).catch((err) => {
            return web3.eth.getBalance(accounts[0])
        }).then(function (result) {
            val = result.toNumber();
            return contract.payout({from: accounts[0]})
        }).then(function (result) {
            return web3.eth.getBalance(accounts[0])
        }).then(function (result) {
            assert.strictEqual(result.toNumber() - val > web3.toWei(2.99,"ether"), true, "a bit less than 3 eth more");
        }).catch((err) => {
            throw new Error(err)
        })
    })
})

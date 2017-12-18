pragma solidity ^0.4.2;


import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/EpicLuckyCoin.sol";


contract TestEpicLuckyCoin {

    function testInitialBalanceUsingDeployedContract() public {
        EpicLuckyCoin esc = EpicLuckyCoin(DeployedAddresses.EpicLuckyCoin());
        Assert.equal(esc.balanceOf(tx.origin), 0, "No coins minted initially");

    }

    function testInitialBalanceWithNewEpicLuckyCoin() public {
        EpicLuckyCoin esc = new EpicLuckyCoin();
        Assert.equal(esc.balanceOf(tx.origin), 0, "No coins minted initially");
    }
}

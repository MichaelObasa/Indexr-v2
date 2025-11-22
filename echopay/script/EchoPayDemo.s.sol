// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import {EchoPayPuller} from "../contracts/EchoPayPuller.sol";
import {MockERC20} from "../contracts/mocks/MockERC20.sol";
import {MockVault} from "../contracts/mocks/MockVault.sol";

/**
 * @title EchoPayDemo
 * @notice End-to-end demo:
 *         - Deploy Mock USDC, Mock Vault, EchoPayPuller
 *         - Mint USDC to user
 *         - Approve EchoPay
 *         - Create plan
 *         - Execute one run
 */
contract EchoPayDemo is Script {
    function run() external {
        // 1) Load private key from env (anvil / local test key)
        uint256 pk = vm.envUint("LOCAL_DEPLOYER_KEY");
        address user = vm.addr(pk);
        vm.startBroadcast(pk);

        // 2) Deploy contracts
        MockERC20 usdc = new MockERC20("Mock USDC", "MUSDC", 6);  // Mock USDC with 6 decimals
        MockVault vault = new MockVault(usdc);                     // Simple ERC4626 vault
        EchoPayPuller puller = new EchoPayPuller();               // EchoPay core

        // 3) Mint 1,000 USDC to the user
        uint256 initialBalance = 1_000e6; // 1,000 USDC with 6 decimals
        usdc.mint(user, initialBalance);

        // 4) Approve EchoPayPuller to spend user's USDC
        // No vm.prank() needed - msg.sender is already the broadcasted key (user)
        usdc.approve(address(puller), type(uint256).max);

        // 5) Create a plan: 400 USDC / month, cap 500 USDC
        uint256 amountPerRun = 400e6;  // 400 USDC
        uint256 monthlyCap   = 500e6;  // 500 USDC
        uint64  firstRun     = uint64(block.timestamp); // run immediately
        uint32  frequency    = 30 days; // once every ~30 days

        // No vm.prank() needed - msg.sender is already the broadcasted key (user)
        uint256 planId = puller.createPlan(
            address(usdc),
            address(vault),
            amountPerRun,
            monthlyCap,
            firstRun,
            frequency
        );

        // 6) Execute the plan once (simulates the bot calling this)
        puller.execute(planId);

        vm.stopBroadcast();

        // 7) Log everything for your demo
        console2.log("=== EchoPay Demo Run ===");
        console2.log("User address:           ", user);
        console2.log("USDC (mock) address:    ", address(usdc));
        console2.log("Vault (mock) address:   ", address(vault));
        console2.log("EchoPayPuller address:  ", address(puller));
        console2.log("Plan ID:                ", planId);
        console2.log("User USDC balance:      ", usdc.balanceOf(user));   // should be 600e6
        console2.log("User vault shares:      ", vault.balanceOf(user));  // should be 400e6
        
        // Access plan struct fields (tuple destructuring)
        (,,,,, uint64 nextRun,,) = puller.plans(planId);
        console2.log("Next run timestamp:     ", nextRun);
    }
}


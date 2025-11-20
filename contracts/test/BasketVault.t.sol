// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test} from "forge-std/Test.sol";
import {BasketVault} from "../src/vaults/BasketVault.sol";
import {BasketRegistry} from "../src/registry/BasketRegistry.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract BasketVaultTest is Test {
    BasketVault public vault;
    BasketRegistry public registry;
    ERC20Mock public usdc;
    address public owner;
    address public user;

    string public constant BASKET_ID = "INDXR-10";
    string public constant VAULT_NAME = "Indexr Top 10 Vault";
    string public constant VAULT_SYMBOL = "INDXR10";

    event VaultPaused(string indexed basketId, address indexed by);
    event VaultUnpaused(string indexed basketId, address indexed by);

    function setUp() public {
        owner = address(0x1);
        user = address(0x2);

        // Deploy mock USDC
        usdc = new ERC20Mock();
        usdc.mint(user, 10000e6); // 10,000 USDC (6 decimals)

        // Deploy registry
        registry = new BasketRegistry(owner);

        // Deploy vault
        vm.prank(owner);
        vault = new BasketVault(
            IERC20(address(usdc)),
            VAULT_NAME,
            VAULT_SYMBOL,
            BASKET_ID,
            address(registry),
            owner
        );

        // User approves vault
        vm.prank(user);
        usdc.approve(address(vault), type(uint256).max);
    }

    function testDepositAndMintShares() public {
        uint256 depositAmount = 1000e6; // 1,000 USDC

        vm.prank(user);
        uint256 shares = vault.deposit(depositAmount, user);

        assertEq(shares, depositAmount, "Shares should equal assets for first deposit");
        assertEq(vault.balanceOf(user), shares, "User should have correct share balance");
        assertEq(usdc.balanceOf(address(vault)), depositAmount, "Vault should hold deposited assets");
        assertEq(vault.totalAssets(), depositAmount, "Total assets should equal deposit");
    }

    function testWithdrawAndRedeemShares() public {
        uint256 depositAmount = 1000e6; // 1,000 USDC

        // First deposit
        vm.prank(user);
        uint256 shares = vault.deposit(depositAmount, user);

        // Withdraw
        vm.prank(user);
        uint256 assetsWithdrawn = vault.redeem(shares, user, user);

        assertEq(assetsWithdrawn, depositAmount, "Should withdraw same amount as deposited");
        assertEq(vault.balanceOf(user), 0, "User should have no shares after redeem");
        assertEq(usdc.balanceOf(address(vault)), 0, "Vault should have no assets");
        assertEq(vault.totalAssets(), 0, "Total assets should be zero");
    }

    function testPausePreventsDepositAndWithdraw() public {
        uint256 depositAmount = 1000e6;

        // Deposit first
        vm.prank(user);
        vault.deposit(depositAmount, user);

        // Pause
        vm.prank(owner);
        vault.pause();

        assertTrue(vault.isPaused(), "Vault should be paused");

        // Try to deposit - should fail
        vm.prank(user);
        vm.expectRevert("BasketVault: paused");
        vault.deposit(depositAmount, user);

        // Try to withdraw - should fail
        vm.prank(user);
        vm.expectRevert("BasketVault: paused");
        vault.redeem(vault.balanceOf(user), user, user);
    }

    function testUnpauseRestoresDepositAndWithdraw() public {
        uint256 depositAmount = 1000e6;

        // Deposit first
        vm.prank(user);
        vault.deposit(depositAmount, user);

        // Pause
        vm.prank(owner);
        vault.pause();

        // Unpause
        vm.prank(owner);
        vault.unpause();

        assertFalse(vault.isPaused(), "Vault should not be paused");

        // Should be able to deposit again
        vm.prank(user);
        uint256 shares = vault.deposit(depositAmount, user);
        assertGt(shares, 0, "Should be able to deposit after unpause");

        // Should be able to withdraw
        vm.prank(user);
        vault.redeem(shares, user, user);
    }

    function testTotalAssetsMatchesUSDCBalance() public {
        uint256 depositAmount = 1000e6;

        vm.prank(user);
        vault.deposit(depositAmount, user);

        assertEq(vault.totalAssets(), usdc.balanceOf(address(vault)), "Total assets should match USDC balance");
    }

    function testNonOwnerCannotPause() public {
        vm.prank(user);
        vm.expectRevert();
        vault.pause();
    }

    function testNonOwnerCannotUnpause() public {
        vm.prank(owner);
        vault.pause();

        vm.prank(user);
        vm.expectRevert();
        vault.unpause();
    }

    function testGetBasketId() public {
        assertEq(vault.getBasketId(), BASKET_ID, "Should return correct basket ID");
    }

    function testGetRegistry() public {
        assertEq(vault.getRegistry(), address(registry), "Should return correct registry address");
    }
}


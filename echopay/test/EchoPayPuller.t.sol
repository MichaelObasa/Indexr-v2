// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;  

import {Test} from "forge-std/Test.sol";
import {EchoPayPuller} from "../contracts/EchoPayPuller.sol";
import {MockERC20} from "../contracts/mocks/MockERC20.sol";
import {MockVault} from "../contracts/mocks/MockVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

contract EchoPayPullerTest is Test {
    EchoPayPuller internal puller;
    MockERC20 internal usdc;
    MockVault internal vault;

    address internal user;
    uint256 internal constant INITIAL_BALANCE = 10_000e6; // 10,000 USDC (6 decimals)

    function setUp() public {
        puller = new EchoPayPuller();

        // Mock USDC with 6 decimals
        usdc = new MockERC20("Mock USDC", "MUSDC", 6);

        // Mint to user
        user = address(0xA11CE);
        usdc.mint(user, INITIAL_BALANCE);

        // Mock vault wrapping USDC
        vault = new MockVault(IERC20(address(usdc)));

        // Label addresses for nicer traces
        vm.label(address(puller), "EchoPayPuller");
        vm.label(address(usdc), "MockUSDC");
        vm.label(address(vault), "MockVault");
        vm.label(user, "User");
    }

    function _createBasicPlan(uint64 firstRun, uint32 frequency, uint256 amountPerRun, uint256 monthlyCap)
        internal
        returns (uint256 planId)
    {
        vm.prank(user);
        planId = puller.createPlan(
            address(usdc),
            address(vault),
            amountPerRun,
            monthlyCap,
            firstRun,
            frequency
        );
    }

    function testCreatePlan() public { 
        uint64 firstRun = uint64(block.timestamp + 1 days);
        uint32 frequency = 30 days;
        uint256 amountPerRun = 400e6;
        uint256 monthlyCap = 500e6;

        uint256 planId = _createBasicPlan(firstRun, frequency, amountPerRun, monthlyCap);

        (address owner,
         address token,
         address vaultAddr,
         uint256 amount,
         uint256 cap, 
         uint64 nextRun,
         uint32 freq,
         bool active) = puller.plans(planId);

        assertEq(owner, user, "owner mismatch");
        assertEq(token, address(usdc), "token mismatch");
        assertEq(vaultAddr, address(vault), "vault mismatch");
        assertEq(amount, amountPerRun, "amountPerRun mismatch");
        assertEq(cap, monthlyCap, "monthlyCap mismatch");
        assertEq(nextRun, firstRun, "nextRun mismatch");
        assertEq(freq, frequency, "frequency mismatch");
        assertTrue(active, "plan should be active");
    }

    function testExecuteSimple() public {
        uint64 firstRun = uint64(block.timestamp + 1 days);
        uint32 frequency = 30 days;
        uint256 amountPerRun = 400e6;
        uint256 monthlyCap = 500e6;

        uint256 planId = _createBasicPlan(firstRun, frequency, amountPerRun, monthlyCap);

        // User approves puller to spend USDC
        vm.prank(user);
        usdc.approve(address(puller), amountPerRun);

        // Move time forward so the plan is due
        vm.warp(firstRun + 1);

        uint256 userBalBefore = usdc.balanceOf(user);
        uint256 vaultAssetsBefore = vault.totalAssets();
        uint256 userSharesBefore = vault.balanceOf(user);

        puller.execute(planId);

        uint256 userBalAfter = usdc.balanceOf(user);
        uint256 vaultAssetsAfter = vault.totalAssets();
        uint256 userSharesAfter = vault.balanceOf(user);

        assertEq(userBalBefore - userBalAfter, amountPerRun, "USDC should be pulled from user");
        assertEq(vaultAssetsAfter - vaultAssetsBefore, amountPerRun, "Vault assets should increase");
        assertEq(userSharesAfter - userSharesBefore, amountPerRun, "User shares should equal amountPerRun");
    }

    function testExecuteNotDueReverts() public {
        uint64 firstRun = uint64(block.timestamp + 1 days);
        uint32 frequency = 30 days;
        uint256 amountPerRun = 400e6;
        uint256 monthlyCap = 500e6;

        uint256 planId = _createBasicPlan(firstRun, frequency, amountPerRun, monthlyCap);

        vm.prank(user);
        usdc.approve(address(puller), amountPerRun);

        // Do NOT warp to firstRun yet
        vm.expectRevert(bytes("not due"));
        puller.execute(planId);
    }

    function testExecuteWithoutAllowanceReverts() public {
        uint64 firstRun = uint64(block.timestamp + 1 days);
        uint32 frequency = 30 days;
        uint256 amountPerRun = 400e6;
        uint256 monthlyCap = 500e6;

        uint256 planId = _createBasicPlan(firstRun, frequency, amountPerRun, monthlyCap);

        // No approve here

        vm.warp(firstRun + 1);

        // transferFrom should fail due to no allowance
        vm.expectRevert();
        puller.execute(planId);
    }

    function testPausePlan() public {
        uint64 firstRun = uint64(block.timestamp + 1 days);
        uint32 frequency = 30 days;
        uint256 amountPerRun = 400e6;
        uint256 monthlyCap = 500e6;

        uint256 planId = _createBasicPlan(firstRun, frequency, amountPerRun, monthlyCap);

        // User pauses the plan
        vm.prank(user);
        puller.pausePlan(planId);

        (, , , , , , , bool active) = puller.plans(planId);
        assertFalse(active, "plan should be inactive after pause");

        // Even if time passes, execute should revert with "inactive"
        vm.warp(firstRun + 1);
        vm.expectRevert(bytes("inactive"));
        puller.execute(planId);
    }

    function testCancelPlan() public {
        uint64 firstRun = uint64(block.timestamp + 1 days);
        uint32 frequency = 30 days;
        uint256 amountPerRun = 400e6;
        uint256 monthlyCap = 500e6;

        uint256 planId = _createBasicPlan(firstRun, frequency, amountPerRun, monthlyCap);

        vm.prank(user);
        puller.cancelPlan(planId);

        (, , , , , , , bool active) = puller.plans(planId);
        assertFalse(active, "plan should be inactive after cancel");

        vm.warp(firstRun + 1);
        vm.expectRevert(bytes("inactive"));
        puller.execute(planId);
    }

    function testNextRunUpdatedAfterExecution() public {
        uint64 firstRun = uint64(block.timestamp + 1 days);
        uint32 frequency = 30 days;
        uint256 amountPerRun = 400e6;
        uint256 monthlyCap = 500e6;

        uint256 planId = _createBasicPlan(firstRun, frequency, amountPerRun, monthlyCap);

        vm.prank(user);
        usdc.approve(address(puller), amountPerRun * 2);

        // First execution
        vm.warp(firstRun + 1);
        puller.execute(planId);
 
        // Check nextRun was updated
        (, , , , , uint64 nextRunAfterFirst, uint32 freq, ) = puller.plans(planId);
        assertEq(freq, frequency, "frequency mismatch");
        assertEq(nextRunAfterFirst, uint64(block.timestamp) + frequency, "nextRun not updated correctly");

        // Second execution
        vm.warp(nextRunAfterFirst + 1);
        puller.execute(planId);

        (, , , , , uint64 nextRunAfterSecond, , ) = puller.plans(planId);
        assertEq(nextRunAfterSecond, uint64(block.timestamp) + frequency, "nextRun not updated after second exec");
    }

    function testNonOwnerCannotPauseOrCancel() public {
        uint64 firstRun = uint64(block.timestamp + 1 days);
        uint32 frequency = 30 days;
        uint256 amountPerRun = 400e6;
        uint256 monthlyCap = 500e6;

        uint256 planId = _createBasicPlan(firstRun, frequency, amountPerRun, monthlyCap);

        address attacker = address(0xBEEF);
        vm.label(attacker, "Attacker");

        vm.prank(attacker);
        vm.expectRevert(bytes("not owner"));
        puller.pausePlan(planId);

        vm.prank(attacker);
        vm.expectRevert(bytes("not owner"));
        puller.cancelPlan(planId);
    }
}

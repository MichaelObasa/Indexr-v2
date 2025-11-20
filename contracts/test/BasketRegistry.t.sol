// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test} from "forge-std/Test.sol";
import {BasketRegistry} from "../src/registry/BasketRegistry.sol";
import {BasketVault} from "../src/vaults/BasketVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract BasketRegistryTest is Test {
    BasketRegistry public registry;
    BasketVault public vault;
    ERC20Mock public usdc;
    address public owner;
    address public nonOwner;

    string public constant BASKET_ID = "INDXR-10";
    string public constant VAULT_NAME = "Indexr Top 10 Vault";
    string public constant VAULT_SYMBOL = "INDXR10";

    event BasketRegistered(string indexed basketId, address indexed vault);
    event BasketTargetsUpdated(string indexed basketId, address[] tokens, uint256[] targetWeightsBps);
    event BasketStatusUpdated(string indexed basketId, bool active);

    function setUp() public {
        owner = address(0x1);
        nonOwner = address(0x2);

        // Deploy mock USDC
        usdc = new ERC20Mock();

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
    }

    function testRegisterBasket() public {
        address[] memory tokens = new address[](2);
        tokens[0] = address(0x100);
        tokens[1] = address(0x200);

        uint256[] memory weights = new uint256[](2);
        weights[0] = 6000; // 60%
        weights[1] = 4000; // 40%

        vm.prank(owner);
        registry.registerBasket(BASKET_ID, address(vault), tokens, weights, 0);

        BasketRegistry.BasketInfo memory info = registry.getBasketById(BASKET_ID);
        assertEq(info.basketId, BASKET_ID, "Basket ID should match");
        assertEq(info.vault, address(vault), "Vault address should match");
        assertEq(info.tokens.length, 2, "Should have 2 tokens");
        assertEq(info.tokens[0], tokens[0], "First token should match");
        assertEq(info.tokens[1], tokens[1], "Second token should match");
        assertEq(info.targetWeightsBps[0], 6000, "First weight should match");
        assertEq(info.targetWeightsBps[1], 4000, "Second weight should match");
        assertTrue(info.active, "Basket should be active");
        assertEq(info.category, 0, "Category should be Classic");
    }

    function testRegisterBasketRejectsDuplicateId() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(0x100);

        uint256[] memory weights = new uint256[](1);
        weights[0] = 10000;

        vm.prank(owner);
        registry.registerBasket(BASKET_ID, address(vault), tokens, weights, 0);

        // Try to register again with same ID
        vm.prank(owner);
        vm.expectRevert("BasketRegistry: basket already exists");
        registry.registerBasket(BASKET_ID, address(vault), tokens, weights, 0);
    }

    function testUpdateBasketTargetsValidatesWeights() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(0x100);

        uint256[] memory weights = new uint256[](1);
        weights[0] = 10000;

        vm.prank(owner);
        registry.registerBasket(BASKET_ID, address(vault), tokens, weights, 0);

        // Update with valid weights
        address[] memory newTokens = new address[](2);
        newTokens[0] = address(0x200);
        newTokens[1] = address(0x300);

        uint256[] memory newWeights = new uint256[](2);
        newWeights[0] = 5000;
        newWeights[1] = 5000;

        vm.prank(owner);
        registry.updateBasketTargets(BASKET_ID, newTokens, newWeights);

        BasketRegistry.BasketInfo memory info = registry.getBasketById(BASKET_ID);
        assertEq(info.tokens.length, 2, "Should have 2 tokens after update");
        assertEq(info.targetWeightsBps[0], 5000, "First weight should be updated");
        assertEq(info.targetWeightsBps[1], 5000, "Second weight should be updated");
    }

    function testUpdateBasketTargetsRejectsInvalidWeights() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(0x100);

        uint256[] memory weights = new uint256[](1);
        weights[0] = 10000;

        vm.prank(owner);
        registry.registerBasket(BASKET_ID, address(vault), tokens, weights, 0);

        // Try to update with weights that don't sum to 100%
        address[] memory newTokens = new address[](2);
        newTokens[0] = address(0x200);
        newTokens[1] = address(0x300);

        uint256[] memory invalidWeights = new uint256[](2);
        invalidWeights[0] = 5000;
        invalidWeights[1] = 4000; // Only 90% total

        vm.prank(owner);
        vm.expectRevert("BasketRegistry: weights must sum to 100%");
        registry.updateBasketTargets(BASKET_ID, newTokens, invalidWeights);
    }

    function testSetBasketActiveTogglesStatus() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(0x100);

        uint256[] memory weights = new uint256[](1);
        weights[0] = 10000;

        vm.prank(owner);
        registry.registerBasket(BASKET_ID, address(vault), tokens, weights, 0);

        assertTrue(registry.isBasketActive(BASKET_ID), "Basket should be active initially");

        // Deactivate
        vm.prank(owner);
        registry.setBasketActive(BASKET_ID, false);

        assertFalse(registry.isBasketActive(BASKET_ID), "Basket should be inactive");

        // Reactivate
        vm.prank(owner);
        registry.setBasketActive(BASKET_ID, true);

        assertTrue(registry.isBasketActive(BASKET_ID), "Basket should be active again");
    }

    function testGetBasketByIdReturnsCorrectData() public {
        address[] memory tokens = new address[](3);
        tokens[0] = address(0x100);
        tokens[1] = address(0x200);
        tokens[2] = address(0x300);

        uint256[] memory weights = new uint256[](3);
        weights[0] = 5000;
        weights[1] = 3000;
        weights[2] = 2000;

        vm.prank(owner);
        registry.registerBasket(BASKET_ID, address(vault), tokens, weights, 1);

        BasketRegistry.BasketInfo memory info = registry.getBasketById(BASKET_ID);
        assertEq(info.basketId, BASKET_ID, "Basket ID should match");
        assertEq(info.vault, address(vault), "Vault should match");
        assertEq(info.tokens.length, 3, "Should have 3 tokens");
        assertEq(info.category, 1, "Category should be Thematic");
    }

    function testGetBasketCount() public {
        assertEq(registry.getBasketCount(), 0, "Should start with 0 baskets");

        address[] memory tokens = new address[](1);
        tokens[0] = address(0x100);

        uint256[] memory weights = new uint256[](1);
        weights[0] = 10000;

        vm.prank(owner);
        registry.registerBasket(BASKET_ID, address(vault), tokens, weights, 0);

        assertEq(registry.getBasketCount(), 1, "Should have 1 basket");
    }

    function testGetVault() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(0x100);

        uint256[] memory weights = new uint256[](1);
        weights[0] = 10000;

        vm.prank(owner);
        registry.registerBasket(BASKET_ID, address(vault), tokens, weights, 0);

        assertEq(registry.getVault(BASKET_ID), address(vault), "Should return correct vault address");
    }

    function testNonOwnerCannotRegisterBasket() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(0x100);

        uint256[] memory weights = new uint256[](1);
        weights[0] = 10000;

        vm.prank(nonOwner);
        vm.expectRevert();
        registry.registerBasket(BASKET_ID, address(vault), tokens, weights, 0);
    }

    function testNonOwnerCannotUpdateBasket() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(0x100);

        uint256[] memory weights = new uint256[](1);
        weights[0] = 10000;

        vm.prank(owner);
        registry.registerBasket(BASKET_ID, address(vault), tokens, weights, 0);

        vm.prank(nonOwner);
        vm.expectRevert();
        registry.updateBasketTargets(BASKET_ID, tokens, weights);
    }

    function testNonOwnerCannotSetBasketActive() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(0x100);

        uint256[] memory weights = new uint256[](1);
        weights[0] = 10000;

        vm.prank(owner);
        registry.registerBasket(BASKET_ID, address(vault), tokens, weights, 0);

        vm.prank(nonOwner);
        vm.expectRevert();
        registry.setBasketActive(BASKET_ID, false);
    }
}


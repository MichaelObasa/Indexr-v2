// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {BasketRegistry} from "../src/registry/BasketRegistry.sol";
import {BasketVault} from "../src/vaults/BasketVault.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Deploy
 * @notice Deployment script for Indexr contracts on Arbitrum Sepolia
 * @dev Deploys MockUSDC, BasketRegistry, and 2 BasketVaults
 * 
 * Usage:
 *   forge script script/Deploy.s.sol:Deploy --rpc-url $ARBITRUM_SEPOLIA_RPC --broadcast --verify
 */
contract Deploy is Script {
    // Deployed contract addresses (logged after deployment)
    address public mockUSDC;
    address public registry;
    address public vault1; // INDXR-10
    address public vault2; // INDXR-AI

    // Sample token addresses for basket composition (placeholder addresses)
    // In production, these would be real token addresses on Arbitrum
    address constant WBTC_PLACEHOLDER = address(0x1);
    address constant WETH_PLACEHOLDER = address(0x2);
    address constant ARB_PLACEHOLDER = address(0x3);
    address constant LINK_PLACEHOLDER = address(0x4);
    address constant UNI_PLACEHOLDER = address(0x5);
    address constant AAVE_PLACEHOLDER = address(0x6);
    address constant RENDER_PLACEHOLDER = address(0x7);
    address constant FET_PLACEHOLDER = address(0x8);
    address constant OCEAN_PLACEHOLDER = address(0x9);
    address constant AGIX_PLACEHOLDER = address(0xA);

    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Indexr contracts...");
        console.log("Deployer address:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockUSDC
        MockUSDC usdc = new MockUSDC();
        mockUSDC = address(usdc);
        console.log("MockUSDC deployed at:", mockUSDC);

        // Mint some USDC to deployer for testing
        usdc.mint(deployer, 1_000_000 * 10 ** 6); // 1M USDC
        console.log("Minted 1,000,000 USDC to deployer");

        // 2. Deploy BasketRegistry
        BasketRegistry basketRegistry = new BasketRegistry(deployer);
        registry = address(basketRegistry);
        console.log("BasketRegistry deployed at:", registry);

        // 3. Deploy BasketVault for INDXR-10 (Top 10 by Market Cap)
        BasketVault indxr10Vault = new BasketVault(
            IERC20(mockUSDC),
            "Indexr Top 10 Vault",
            "INDXR10",
            "INDXR-10",
            registry,
            deployer
        );
        vault1 = address(indxr10Vault);
        console.log("INDXR-10 Vault deployed at:", vault1);

        // 4. Deploy BasketVault for INDXR-AI (AI Projects)
        BasketVault indxrAIVault = new BasketVault(
            IERC20(mockUSDC),
            "Indexr AI Projects Vault",
            "INDXRAI",
            "INDXR-AI",
            registry,
            deployer
        );
        vault2 = address(indxrAIVault);
        console.log("INDXR-AI Vault deployed at:", vault2);

        // 5. Register baskets in registry

        // INDXR-10: Top 10 by market cap (simplified composition)
        address[] memory tokens10 = new address[](5);
        tokens10[0] = WBTC_PLACEHOLDER;  // BTC
        tokens10[1] = WETH_PLACEHOLDER;  // ETH
        tokens10[2] = ARB_PLACEHOLDER;   // ARB
        tokens10[3] = LINK_PLACEHOLDER;  // LINK
        tokens10[4] = UNI_PLACEHOLDER;   // UNI

        uint256[] memory weights10 = new uint256[](5);
        weights10[0] = 3500; // 35% BTC
        weights10[1] = 3000; // 30% ETH
        weights10[2] = 1500; // 15% ARB
        weights10[3] = 1000; // 10% LINK
        weights10[4] = 1000; // 10% UNI

        basketRegistry.registerBasket(
            "INDXR-10",
            vault1,
            tokens10,
            weights10,
            0 // Category: Classic
        );
        console.log("INDXR-10 registered in registry");

        // INDXR-AI: AI Projects basket
        address[] memory tokensAI = new address[](5);
        tokensAI[0] = RENDER_PLACEHOLDER; // RENDER
        tokensAI[1] = FET_PLACEHOLDER;    // FET
        tokensAI[2] = OCEAN_PLACEHOLDER;  // OCEAN
        tokensAI[3] = AGIX_PLACEHOLDER;   // AGIX
        tokensAI[4] = AAVE_PLACEHOLDER;   // AAVE (placeholder)

        uint256[] memory weightsAI = new uint256[](5);
        weightsAI[0] = 2500; // 25% RENDER
        weightsAI[1] = 2500; // 25% FET
        weightsAI[2] = 2000; // 20% OCEAN
        weightsAI[3] = 2000; // 20% AGIX
        weightsAI[4] = 1000; // 10% Other

        basketRegistry.registerBasket(
            "INDXR-AI",
            vault2,
            tokensAI,
            weightsAI,
            1 // Category: Thematic
        );
        console.log("INDXR-AI registered in registry");

        vm.stopBroadcast();

        // Output deployment summary
        console.log("\n========== DEPLOYMENT SUMMARY ==========");
        console.log("Network: Arbitrum Sepolia");
        console.log("Deployer:", deployer);
        console.log("");
        console.log("MockUSDC:", mockUSDC);
        console.log("BasketRegistry:", registry);
        console.log("INDXR-10 Vault:", vault1);
        console.log("INDXR-AI Vault:", vault2);
        console.log("=========================================\n");
    }
}

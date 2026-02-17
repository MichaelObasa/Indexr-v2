// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {BasketRegistry} from "../src/registry/BasketRegistry.sol";
import {BasketVault} from "../src/vaults/BasketVault.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Import EchoPayPuller from echopay folder
// Note: We'll deploy this separately or copy the contract

/**
 * @title DeployAll
 * @notice Complete deployment script for all Indexr + EchoPay contracts
 * @dev Deploys to Arbitrum Sepolia testnet
 * 
 * Environment Variables Required:
 *   - PRIVATE_KEY: Deployer's private key
 *   - ARBITRUM_SEPOLIA_RPC: RPC URL for Arbitrum Sepolia
 * 
 * Usage:
 *   cd contracts
 *   forge script script/DeployAll.s.sol:DeployAll \
 *     --rpc-url $ARBITRUM_SEPOLIA_RPC \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 */
contract DeployAll is Script {
    // Deployed addresses
    MockUSDC public usdc;
    BasketRegistry public registry;
    BasketVault public indxr10Vault;
    BasketVault public indxrAIVault;

    // Placeholder token addresses (for basket composition display)
    // These represent the "target" tokens in each basket
    // In Phase 1, vaults only hold USDC - no actual swaps occur
    address constant WBTC = address(0x1111111111111111111111111111111111111111);
    address constant WETH = address(0x2222222222222222222222222222222222222222);
    address constant ARB = address(0x3333333333333333333333333333333333333333);
    address constant LINK = address(0x4444444444444444444444444444444444444444);
    address constant UNI = address(0x5555555555555555555555555555555555555555);
    address constant RENDER = address(0x6666666666666666666666666666666666666666);
    address constant FET = address(0x7777777777777777777777777777777777777777);
    address constant OCEAN = address(0x8888888888888888888888888888888888888888);
    address constant AGIX = address(0x9999999999999999999999999999999999999999);
    address constant TAO = address(0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA);

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("   INDEXR DEPLOYMENT - ARBITRUM SEPOLIA    ");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // ===== 1. Deploy MockUSDC =====
        usdc = new MockUSDC();
        console.log("[1/5] MockUSDC deployed:", address(usdc));

        // Mint initial supply to deployer 
        usdc.mint(deployer, 10_000_000 * 10 ** 6); // 10M USDC
        console.log("      Minted 10,000,000 USDC to deployer");

        // ===== 2. Deploy BasketRegistry =====
        registry = new BasketRegistry(deployer);
        console.log("[2/5] BasketRegistry deployed:", address(registry));

        // ===== 3. Deploy INDXR-10 Vault (Top 10 Classic) =====
        indxr10Vault = new BasketVault(
            IERC20(address(usdc)),
            "Indexr Top 10 Vault",
            "INDXR10",
            "INDXR-10",
            address(registry),
            deployer
        );
        console.log("[3/5] INDXR-10 Vault deployed:", address(indxr10Vault));

        // ===== 4. Deploy INDXR-AI Vault (AI Thematic) =====
        indxrAIVault = new BasketVault(
            IERC20(address(usdc)),
            "Indexr AI Projects Vault",
            "INDXRAI",
            "INDXR-AI",
            address(registry),
            deployer
        );
        console.log("[4/5] INDXR-AI Vault deployed:", address(indxrAIVault));

        // ===== 5. Register Baskets =====
        _registerBaskets();
        console.log("[5/5] Baskets registered in registry");

        vm.stopBroadcast();

        // ===== Output JSON config =====
        _outputConfig(deployer);
    }

    function _registerBaskets() internal {
        // ----- INDXR-10: Top 10 by Market Cap -----
        address[] memory tokens10 = new address[](5);
        tokens10[0] = WBTC;   // Bitcoin
        tokens10[1] = WETH;   // Ethereum
        tokens10[2] = ARB;    // Arbitrum
        tokens10[3] = LINK;   // Chainlink
        tokens10[4] = UNI;    // Uniswap

        uint256[] memory weights10 = new uint256[](5);
        weights10[0] = 3500;  // 35%
        weights10[1] = 3000;  // 30%
        weights10[2] = 1500;  // 15%
        weights10[3] = 1000;  // 10%
        weights10[4] = 1000;  // 10%

        registry.registerBasket(
            "INDXR-10",
            address(indxr10Vault),
            tokens10,
            weights10,
            0 // Classic
        );

        // ----- INDXR-AI: AI Projects -----
        address[] memory tokensAI = new address[](5);
        tokensAI[0] = RENDER; // Render
        tokensAI[1] = FET;    // Fetch.ai
        tokensAI[2] = OCEAN;  // Ocean Protocol
        tokensAI[3] = AGIX;   // SingularityNET
        tokensAI[4] = TAO;    // Bittensor

        uint256[] memory weightsAI = new uint256[](5);
        weightsAI[0] = 2500;  // 25%
        weightsAI[1] = 2500;  // 25%
        weightsAI[2] = 2000;  // 20%
        weightsAI[3] = 1500;  // 15%
        weightsAI[4] = 1500;  // 15%

        registry.registerBasket(
            "INDXR-AI",
            address(indxrAIVault),
            tokensAI,
            weightsAI,
            1 // Thematic
        );
    }

    function _outputConfig(address deployer) internal view {
        console.log("");
        console.log("===========================================");
        console.log("         DEPLOYMENT COMPLETE               ");
        console.log("===========================================");
        console.log("");
        console.log("Copy this to your frontend .env.local:");
        console.log("");
        console.log("NEXT_PUBLIC_CHAIN_ID=421614");
        console.log("NEXT_PUBLIC_USDC_ADDRESS=", address(usdc));
        console.log("NEXT_PUBLIC_REGISTRY_ADDRESS=", address(registry));
        console.log("NEXT_PUBLIC_INDXR10_VAULT=", address(indxr10Vault));
        console.log("NEXT_PUBLIC_INDXRAI_VAULT=", address(indxrAIVault));
        console.log("");
        console.log("===========================================");
        console.log("");
        console.log("Verify contracts on Arbiscan:");
        console.log("forge verify-contract", address(usdc), "src/mocks/MockUSDC.sol:MockUSDC --chain arbitrum-sepolia");
        console.log("");
    }
}


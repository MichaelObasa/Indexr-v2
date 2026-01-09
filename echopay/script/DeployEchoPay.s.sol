// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {EchoPayPuller} from "../contracts/EchoPayPuller.sol";

/**
 * @title DeployEchoPay
 * @notice Deployment script for EchoPayPuller contract
 * @dev Deploy after Indexr contracts are deployed 
 * 
 * Environment Variables Required:
 *   - PRIVATE_KEY: Deployer's private key
 *   - ARBITRUM_SEPOLIA_RPC: RPC URL for Arbitrum Sepolia
 * 
 * Usage:
 *   cd echopay
 *   forge script script/DeployEchoPay.s.sol:DeployEchoPay \
 *     --rpc-url $ARBITRUM_SEPOLIA_RPC \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 */
contract DeployEchoPay is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("   ECHOPAY DEPLOYMENT - ARBITRUM SEPOLIA   ");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy EchoPayPuller
        EchoPayPuller puller = new EchoPayPuller();
        console.log("[1/1] EchoPayPuller deployed:", address(puller));

        vm.stopBroadcast();

        console.log("");
        console.log("===========================================");
        console.log("         ECHOPAY DEPLOYMENT COMPLETE       ");
        console.log("===========================================");
        console.log("");
        console.log("Add to your frontend .env.local:");
        console.log("NEXT_PUBLIC_ECHOPAY_ADDRESS=", address(puller));
        console.log("");
    }
}


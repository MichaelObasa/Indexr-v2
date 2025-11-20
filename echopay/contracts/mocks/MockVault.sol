// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockVault
 * @notice Simple ERC4626 vault wrapping an underlying ERC20 for testing EchoPay
 * @dev Uses the default 1:1 asset/share logic of ERC4626
 */
contract MockVault is ERC4626 {
    constructor(IERC20 asset_)
        ERC20("Mock Vault", "MVLT")
        ERC4626(asset_)
    {}
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
 
/**
 * @title EchoPayPuller
 * @notice Core contract for recurring USDC investments into ERC4626 vaults (e.g. Indexr funds)
 * @dev MVP version - basic plan creation and execution
 */
contract EchoPayPuller {
    /// @notice Plan structure for auto-invest rules
    struct Plan {
        address owner;        // User's wallet
        address token;        // USDC (ERC20)
        address vault;        // ERC4626 vault (e.g. Indexr fund)
        uint256 amountPerRun; // Amount to invest per execution
        uint256 monthlyCap;   // Maximum monthly spend limit (soft cap for now)
        uint64 nextRun;       // Unix timestamp for next execution
        uint32 frequency;     // Seconds between runs
        bool active;          // Whether plan is active
    }

    /// @notice Next plan ID to assign
    uint256 public nextPlanId;

    /// @notice Mapping from plan ID to Plan struct
    mapping(uint256 => Plan) public plans;

    /// @notice Emitted when a new plan is created
    event PlanCreated(uint256 indexed planId, address indexed owner);

    /// @notice Emitted when a plan is executed
    event PlanExecuted(uint256 indexed planId, address indexed owner, uint256 amount);

    /// @notice Emitted when a plan is paused
    event PlanPaused(uint256 indexed planId, address indexed owner);

    /// @notice Emitted when a plan is cancelled
    event PlanCancelled(uint256 indexed planId, address indexed owner);

    /**
     * @notice Create a new auto-invest plan
     * @param token USDC token address
     * @param vault ERC4626 vault address
     * @param amountPerRun Amount to invest per execution
     * @param monthlyCap Maximum monthly spend limit (must be >= amountPerRun)
     * @param firstRun Unix timestamp for first execution
     * @param frequency Seconds between executions
     * @return planId The ID of the newly created plan
     */
    function createPlan(
        address token,
        address vault,
        uint256 amountPerRun,
        uint256 monthlyCap,
        uint64 firstRun,
        uint32 frequency
    ) external returns (uint256 planId) {
        require(token != address(0), "token zero");
        require(vault != address(0), "vault zero");
        require(amountPerRun > 0, "amountPerRun zero");
        require(monthlyCap >= amountPerRun, "cap < amount");
        require(frequency > 0, "frequency zero");

        planId = nextPlanId;
        nextPlanId++;

        plans[planId] = Plan({
            owner: msg.sender,
            token: token,
            vault: vault,
            amountPerRun: amountPerRun,
            monthlyCap: monthlyCap,
            nextRun: firstRun,
            frequency: frequency,
            active: true
        });

        emit PlanCreated(planId, msg.sender);
    }

    /**
     * @notice Pause an active plan (can be resumed later by adding a resume function in future)
     * @param planId The ID of the plan to pause
     */
    function pausePlan(uint256 planId) external {
        Plan storage plan = plans[planId];
        require(plan.owner != address(0), "plan not found");
        require(msg.sender == plan.owner, "not owner");
        require(plan.active, "already inactive");

        plan.active = false;
        emit PlanPaused(planId, plan.owner);
    }

    /**
     * @notice Cancel a plan permanently
     * @param planId The ID of the plan to cancel
     */
    function cancelPlan(uint256 planId) external {
        Plan storage plan = plans[planId];
        require(plan.owner != address(0), "plan not found");
        require(msg.sender == plan.owner, "not owner");
        require(plan.active, "already inactive");

        plan.active = false;
        emit PlanCancelled(planId, plan.owner);
    }

    /**
     * @notice Execute a plan - pull USDC and deposit into vault
     * @param planId The ID of the plan to execute
     * @dev This function can be called by anyone (bot/keeper) when plan is due
     *
     * For MVP, we:
     * - Check that the plan is active
     * - Check block.timestamp >= nextRun
     * - Check amountPerRun <= monthlyCap (simple cap logic)
     * - transferFrom owner -> this contract
     * - approve vault
     * - deposit into vault for owner
     * - update nextRun
     */
    function execute(uint256 planId) external {
        Plan storage plan = plans[planId];

        require(plan.owner != address(0), "plan not found");
        require(plan.active, "inactive");
        require(block.timestamp >= plan.nextRun, "not due");
        require(plan.amountPerRun <= plan.monthlyCap, "over cap");

        // Pull USDC from user
        IERC20(plan.token).transferFrom(plan.owner, address(this), plan.amountPerRun);

        // Approve vault to spend USDC
        IERC20(plan.token).approve(plan.vault, plan.amountPerRun);

        // Deposit into vault (shares go directly to plan owner)
        IERC4626(plan.vault).deposit(plan.amountPerRun, plan.owner);

        // Update next run time
        plan.nextRun = uint64(block.timestamp) + plan.frequency;

        emit PlanExecuted(planId, plan.owner, plan.amountPerRun);
    }
 
    // Future enhancements (not needed for MVP tests):
    // - Add monthly window tracking (spentThisPeriod, periodId)
    // - Add expiry date support (expiresAt field)
    // - Add more detailed cap logic (track spentThisPeriod per month)
    // - Add access control for trusted executors (keeper/bot whitelist)
    // - Add resumePlan() function to reactivate paused plans
    // - Add updatePlan() function to modify plan parameters
}

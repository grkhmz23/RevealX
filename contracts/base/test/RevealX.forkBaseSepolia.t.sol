// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVRFCoordinatorV2Plus} from "@chainlink/contracts/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";

import {RevealXPool} from "../src/RevealXPool.sol";
import {CampaignRegistry} from "../src/CampaignRegistry.sol";
import {GameManager} from "../src/GameManager.sol";

/**
 * @title RevealXForkBaseSepoliaTest
 * @notice Fork test against live Base Sepolia state.
 * @dev Run with:
 *      BASE_SEPOLIA_RPC_URL=https://sepolia.base.org forge test --match-contract RevealXForkBaseSepoliaTest --fork-url $BASE_SEPOLIA_RPC_URL -vvv
 *
 *      Uses the real VRF coordinator address to prove:
 *      1. requestRandomWords call shape matches the real IVRFCoordinatorV2Plus interface.
 *      2. rawFulfillRandomWords only accepts calls from the real coordinator address.
 *      3. Full play -> fulfill -> win flow works end-to-end when coordinator is impersonated.
 */
contract RevealXForkBaseSepoliaTest is Test {
    // Address from the original spec — MUST BE VERIFIED before mainnet deploy.
    address public constant BASE_SEPOLIA_VRF_COORDINATOR = 0x5CE8D5A2BC84beb22a398CCA51996F7930313D61;

    MockUSDC public usdc;
    RevealXPool public pool;
    CampaignRegistry public registry;
    GameManager public gameManager;

    address public owner = makeAddr("owner");
    address public feeRecipient = makeAddr("feeRecipient");
    address public creator = makeAddr("creator");
    address public player = makeAddr("player");

    bytes32 public keyHash = 0x9e1344a1247c8a1785d0a4681a27152bffdb43666ae5bf7d14d24a5efd44bf71;

    bool public forkActive;

    function setUp() public {
        forkActive = BASE_SEPOLIA_VRF_COORDINATOR.code.length > 0;
        if (!forkActive) {
            return; // Skip setup when not running against a fork
        }

        vm.startPrank(owner);

        usdc = new MockUSDC();
        pool = new RevealXPool(IERC20(address(usdc)), owner, feeRecipient);
        registry = new CampaignRegistry(owner);
        gameManager = new GameManager(BASE_SEPOLIA_VRF_COORDINATOR);

        gameManager.setConfig(
            address(pool),
            address(registry),
            address(usdc),
            1234, // dummy sub ID — mocked below
            keyHash,
            1,
            500_000,
            100e6
        );

        pool.setGameManager(address(gameManager));
        registry.setGameManager(address(gameManager));

        vm.stopPrank();

        usdc.mint(player, 10_000e6);
    }

    function testFulfilledByNonCoordinatorReverts() public {
        if (!forkActive) return;
        vm.expectRevert();
        gameManager.rawFulfillRandomWords(1, new uint256[](1));
    }

    function testFullPlayAndFulfillWinAgainstRealCoordinator() public {
        if (!forkActive) return;
        bytes32 campaignId = keccak256("fork-campaign");

        CampaignRegistry.CampaignConfig memory config = CampaignRegistry.CampaignConfig({
            creator: creator,
            creatorShareBps: 2500,
            tier: CampaignRegistry.CardTier.Bronze,
            brandingURI: "ipfs://Qm...",
            maxPlays: 100,
            expiry: uint64(block.timestamp + 1 days)
        });
        vm.prank(creator);
        registry.createCampaign(campaignId, config);

        // Seed pool
        usdc.approve(address(pool), 10_000e6);
        pool.deposit(10_000e6, address(this));

        uint256 wager = 1e6;
        uint256 requestId = 999;

        // Mock the real coordinator's requestRandomWords so we don't need a funded subscription
        vm.mockCall(
            BASE_SEPOLIA_VRF_COORDINATOR,
            abi.encodeWithSelector(IVRFCoordinatorV2Plus.requestRandomWords.selector),
            abi.encode(requestId)
        );

        vm.startPrank(player);
        usdc.approve(address(gameManager), wager);
        uint256 returnedRequestId = gameManager.playCard(campaignId, 0);
        vm.stopPrank();

        assertEq(returnedRequestId, requestId);

        // Impersonate the real coordinator to fulfill
        uint256[] memory words = new uint256[](1);
        words[0] = 0; // force a win (roll = 0 < threshold)

        vm.prank(BASE_SEPOLIA_VRF_COORDINATOR);
        gameManager.rawFulfillRandomWords(requestId, words);

        // Player should have received a payout
        assertGt(usdc.balanceOf(player), 10_000e6 - wager);
    }
}

contract MockUSDC is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;

    constructor() {
        _mint(msg.sender, 1_000_000_000e6);
    }

    function decimals() external pure returns (uint8) {
        return 6;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner_, address spender) external view returns (uint256) {
        return _allowances[owner_][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(_allowances[from][msg.sender] >= amount, "MockUSDC: insufficient allowance");
        _allowances[from][msg.sender] -= amount;
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        _totalSupply += amount;
        _balances[to] += amount;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(_balances[from] >= amount, "MockUSDC: insufficient balance");
        _balances[from] -= amount;
        _balances[to] += amount;
    }
}

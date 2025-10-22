// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// PropertyToken — долевой токен объекта (18 decimals) с покупкой за USDT (6 decimals).
/// Comments (design & steps):
/// 1) Хранит мета (name, symbol, description, imageURI), лимиты выпуска и цену в micro-USDT.
/// 2) Имеет owner, pause, treasury, адрес платёжного токена usdt (IERC20).
/// 3) buy(amountTokens): списывает USDT у покупателя (approve → transferFrom) и минтит токены.
/// 4) Поддержка transfer/approve/transferFrom (минимальный ERC20-профиль).
/// 5) updatePrice/metadata/treasury — через onlyOwner; события для индексирования.

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract PropertyToken {
    // Meta
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    // Supply
    uint256 public totalSupply;
    uint256 public maxSupply;

    // Price in micro-USDT (6 decimals)
    uint256 public pricePerTokenUSDT;

    // Business meta
    string public assetDescription;
    string public imageURI;

    // Control
    address public owner;
    bool public paused;

    // Payment
    IERC20 public immutable usdt;
    address public treasury;

    // Balances/allowances
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed _owner, address indexed spender, uint256 value);
    event TokenMinted(address indexed to, uint256 amount, uint256 timestamp);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event Paused(address account);
    event Unpaused(address account);
    event Bought(address indexed buyer, uint256 tokens, uint256 usdtPaid, uint256 timestamp);
    event TreasuryChanged(address oldTreasury, address newTreasury);
    event MetadataUpdated(string imageURI, string description);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        uint256 _pricePerTokenUSDT, // 6 decimals
        string memory _description,
        string memory _imageURI,
        address _usdt,
        address _treasury,
        address _owner
    ) {
        require(_maxSupply > 0, "Max supply must be > 0");
        require(_owner != address(0), "Invalid owner");
        require(_usdt != address(0), "Invalid USDT");
        require(_treasury != address(0), "Invalid treasury");

        name = _name;
        symbol = _symbol;
        maxSupply = _maxSupply;
        pricePerTokenUSDT = _pricePerTokenUSDT;
        assetDescription = _description;
        imageURI = _imageURI;
        usdt = IERC20(_usdt);
        treasury = _treasury;
        owner = _owner;
        paused = false;
    }

    // ERC20-min
    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "Invalid spender");
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external whenNotPaused returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external whenNotPaused returns (bool) {
        require(from != address(0) && to != address(0), "Invalid addr");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");

        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    // Owner ops
    function mint(address to, uint256 amount) external onlyOwner whenNotPaused {
        require(to != address(0), "Invalid recipient");
        require(totalSupply + amount <= maxSupply, "Exceeds max supply");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
        emit TokenMinted(to, amount, block.timestamp);
    }

    function updatePrice(uint256 newPricePerTokenUSDT) external onlyOwner {
        uint256 old = pricePerTokenUSDT;
        pricePerTokenUSDT = newPricePerTokenUSDT;
        emit PriceUpdated(old, newPricePerTokenUSDT, block.timestamp);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        address old = treasury;
        treasury = newTreasury;
        emit TreasuryChanged(old, newTreasury);
    }

    function setMetadata(string calldata _imageURI, string calldata _description) external onlyOwner {
        imageURI = _imageURI;
        assetDescription = _description;
        emit MetadataUpdated(_imageURI, _description);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // Buy via USDT (buyer must approve USDT for this contract beforehand)
    function buy(uint256 amountTokens) external whenNotPaused returns (uint256 usdtPaid) {
        require(amountTokens > 0, "Zero amount");
        require(totalSupply + amountTokens <= maxSupply, "Exceeds max supply");
        require(pricePerTokenUSDT > 0, "Price not set");

        // amountTokens (1e18) * price (1e6) / 1e18 => USDT (1e6)
        usdtPaid = (amountTokens * pricePerTokenUSDT) / 1e18;
        require(usdtPaid > 0, "Too cheap");

        // Pull USDT to treasury
        bool ok = usdt.transferFrom(msg.sender, treasury, usdtPaid);
        require(ok, "USDT transfer failed");

        // Mint to buyer
        totalSupply += amountTokens;
        balanceOf[msg.sender] += amountTokens;
        emit Transfer(address(0), msg.sender, amountTokens);
        emit TokenMinted(msg.sender, amountTokens, block.timestamp);
        emit Bought(msg.sender, amountTokens, usdtPaid, block.timestamp);
    }

    // Views
    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalSupply;
    }

    function getTokenInfo() external view returns (
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        uint256 _maxSupply,
        uint256 _pricePerTokenUSDT,
        string memory _description,
        string memory _imageURI,
        bool _paused,
        address _usdt,
        address _treasury,
        address _owner
    ) {
        return (
            name,
            symbol,
            totalSupply,
            maxSupply,
            pricePerTokenUSDT,
            assetDescription,
            imageURI,
            paused,
            address(usdt),
            treasury,
            owner
        );
    }
}

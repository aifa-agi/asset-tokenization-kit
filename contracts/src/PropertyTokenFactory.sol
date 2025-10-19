// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PropertyTokenFactory
 * @notice Фабрика для создания PropertyToken контрактов
 * @dev Версия БЕЗ import - все контракты независимые для Tenderly API
 */

// ============================================
// PropertyToken контракт (inline для Factory)
// ============================================
contract PropertyToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    uint256 public maxSupply;
    uint256 public pricePerToken;
    string public assetDescription;
    bool public paused;
    
    address public owner;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TokenMinted(address indexed to, uint256 amount, uint256 timestamp);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event Paused(address account);
    event Unpaused(address account);
    
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
        uint256 _pricePerToken,
        string memory _description,
        address _owner
    ) {
        require(_maxSupply > 0, "Max supply must be > 0");
        require(_owner != address(0), "Invalid owner");
        
        name = _name;
        symbol = _symbol;
        maxSupply = _maxSupply;
        pricePerToken = _pricePerToken;
        assetDescription = _description;
        owner = _owner;
        paused = false;
    }
    
    function mint(address to, uint256 amount) external onlyOwner whenNotPaused {
        require(to != address(0), "Invalid recipient");
        require(totalSupply + amount <= maxSupply, "Exceeds max supply");
        
        totalSupply += amount;
        balanceOf[to] += amount;
        
        emit Transfer(address(0), to, amount);
        emit TokenMinted(to, amount, block.timestamp);
    }
    
    function transfer(address to, uint256 amount) external whenNotPaused returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "Invalid spender");
        
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) 
        external 
        whenNotPaused 
        returns (bool) 
    {
        require(from != address(0), "Invalid sender");
        require(to != address(0), "Invalid recipient");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function burn(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        
        emit Transfer(msg.sender, address(0), amount);
    }
    
    function updatePrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = pricePerToken;
        pricePerToken = newPrice;
        emit PriceUpdated(oldPrice, newPrice, block.timestamp);
    }
    
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalSupply;
    }
    
    function getTokenInfo() external view returns (
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        uint256 _maxSupply,
        uint256 _pricePerToken,
        string memory _description,
        bool _paused
    ) {
        return (
            name,
            symbol,
            totalSupply,
            maxSupply,
            pricePerToken,
            assetDescription,
            paused
        );
    }
}

// ============================================
// Factory контракт
// ============================================
contract PropertyTokenFactory {
    address[] public allTokens;
    mapping(string => address) public tokenBySymbol;
    
    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 maxSupply,
        uint256 pricePerToken,
        address indexed creator,
        uint256 timestamp
    );
    
    function createToken(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        uint256 pricePerToken,
        string memory description
    ) external returns (address newToken) {
        require(tokenBySymbol[symbol] == address(0), "Symbol already exists");
        
        // ✅ Создаём PropertyToken через new (inline контракт выше)
        PropertyToken token = new PropertyToken(
            name,
            symbol,
            maxSupply,
            pricePerToken,
            description,
            msg.sender
        );
        
        newToken = address(token);
        allTokens.push(newToken);
        tokenBySymbol[symbol] = newToken;
        
        emit TokenCreated(
            newToken,
            name,
            symbol,
            maxSupply,
            pricePerToken,
            msg.sender,
            block.timestamp
        );
        
        return newToken;
    }
    
    function totalTokens() external view returns (uint256) {
        return allTokens.length;
    }
    
    function getToken(uint256 index) external view returns (address) {
        require(index < allTokens.length, "Index out of bounds");
        return allTokens[index];
    }
    
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
    
    function tokenExists(string memory symbol) external view returns (bool) {
        return tokenBySymbol[symbol] != address(0);
    }
}

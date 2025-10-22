// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// MockUSDT (6 decimals), faucet & mint — тестовый платёжный токен.
/// ИСПРАВЛЕНО: Без начального баланса в конструкторе
/// Comments (design & steps):
/// 1) ERC20-совместимые поля/ивенты/методы с 6 знаками после запятой.
/// 2) Конструктор НЕ выпускает токены (начинаем с 0).
/// 3) faucet() и mint() для тестовых сценариев.
/// 4) transfer/approve/transferFrom — минимальная реализация без SafeERC20.

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address who) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract MockUSDT is IERC20 {
    string public name = "Mock USDT";
    string public symbol = "USDT";
    uint8 public constant decimals = 6;

    uint256 public override totalSupply;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    // ✅ ИСПРАВЛЕНО: Начинаем с 0 баланса
    constructor() {
        // Все токены получают через mint() или faucet()
    }

    function mint(address to, uint256 amount) external {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be > 0");
        
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function faucet() external {
        uint256 amount = 1000 * 10 ** 6; // 1000 USDT
        totalSupply += amount;
        balanceOf[msg.sender] += amount;
        emit Transfer(address(0), msg.sender, amount);
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        require(spender != address(0), "Invalid spender");
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(from != address(0) && to != address(0), "Invalid addr");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");

        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
        return true;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// Factory — развёртывает реальные PropertyToken и хранит реестр по символам.
/// Comments (design & steps):
/// 1) Предотвращает дубли символов; эмитит событие TokenCreated.
/// 2) В createToken передаём все бизнес-параметры и адреса usdt/treasury.
/// 3) Владелец нового токена — msg.sender (администратор, создавший объект).
/// ВАЖНО: Убедитесь, что при компиляции присутствует исходник PropertyToken.sol
/// под именем "PropertyToken.sol" (без ./), чтобы import разрешился.
import "PropertyToken.sol";

contract PropertyTokenFactory {
    address[] public allTokens;
    mapping(string => address) public tokenBySymbol;

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 maxSupply,
        uint256 pricePerTokenUSDT,
        address indexed creator,
        uint256 timestamp
    );

    function createToken(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        uint256 _pricePerTokenUSDT, // 6 decimals (micro-USDT)
        string memory _description,
        string memory _imageURI,
        address _usdt,
        address _treasury
    ) external returns (address newToken) {
        require(tokenBySymbol[_symbol] == address(0), "Symbol already exists");
        require(_maxSupply > 0, "Max supply must be > 0");
        require(_usdt != address(0) && _treasury != address(0), "USDT/treasury required");

        PropertyToken token = new PropertyToken(
            _name,
            _symbol,
            _maxSupply,
            _pricePerTokenUSDT,
            _description,
            _imageURI,
            _usdt,
            _treasury,
            msg.sender
        );

        newToken = address(token);
        allTokens.push(newToken);
        tokenBySymbol[_symbol] = newToken;

        emit TokenCreated(
            newToken,
            _name,
            _symbol,
            _maxSupply,
            _pricePerTokenUSDT,
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

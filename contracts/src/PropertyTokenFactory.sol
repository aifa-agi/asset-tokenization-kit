// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
        
        // Временная заглушка для теста
        newToken = address(uint160(uint256(keccak256(abi.encodePacked(symbol, block.timestamp)))));
        
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

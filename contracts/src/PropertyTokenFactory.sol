{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // SPDX-License-Identifier: MIT\
pragma solidity ^0.8.20;\
\
import "./PropertyToken.sol";\
\
contract PropertyTokenFactory \{\
    address[] public allTokens;\
    mapping(string => address) public tokenBySymbol;\
    \
    event TokenCreated(\
        address indexed tokenAddress,\
        string name,\
        string symbol,\
        uint256 maxSupply,\
        uint256 pricePerToken,\
        address indexed creator,\
        uint256 timestamp\
    );\
    \
    function createToken(\
        string memory name,\
        string memory symbol,\
        uint256 maxSupply,\
        uint256 pricePerToken,\
        string memory description\
    ) external returns (address newToken) \{\
        require(tokenBySymbol[symbol] == address(0), "Symbol already exists");\
        \
        PropertyToken token = new PropertyToken(\
            name,\
            symbol,\
            maxSupply,\
            pricePerToken,\
            description,\
            msg.sender\
        );\
        \
        newToken = address(token);\
        allTokens.push(newToken);\
        tokenBySymbol[symbol] = newToken;\
        \
        emit TokenCreated(\
            newToken,\
            name,\
            symbol,\
            maxSupply,\
            pricePerToken,\
            msg.sender,\
            block.timestamp\
        );\
        \
        return newToken;\
    \}\
    \
    function totalTokens() external view returns (uint256) \{\
        return allTokens.length;\
    \}\
    \
    function getToken(uint256 index) external view returns (address) \{\
        require(index < allTokens.length, "Index out of bounds");\
        return allTokens[index];\
    \}\
    \
    function getAllTokens() external view returns (address[] memory) \{\
        return allTokens;\
    \}\
    \
    function tokenExists(string memory symbol) external view returns (bool) \{\
        return tokenBySymbol[symbol] != address(0);\
    \}\
\}\
}
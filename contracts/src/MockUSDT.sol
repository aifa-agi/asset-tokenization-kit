{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // SPDX-License-Identifier: MIT\
pragma solidity ^0.8.20;\
\
contract MockUSDT \{\
    string public name = "Mock USDT";\
    string public symbol = "USDT";\
    uint8 public constant decimals = 6;\
    uint256 public totalSupply;\
    \
    mapping(address => uint256) public balanceOf;\
    mapping(address => mapping(address => uint256)) public allowance;\
    \
    event Transfer(address indexed from, address indexed to, uint256 value);\
    event Approval(address indexed owner, address indexed spender, uint256 value);\
    \
    constructor() \{\
        // Mint 1,000,000 USDT to deployer\
        uint256 initialSupply = 1_000_000 * 10**6;\
        totalSupply = initialSupply;\
        balanceOf[msg.sender] = initialSupply;\
        emit Transfer(address(0), msg.sender, initialSupply);\
    \}\
    \
    function mint(address to, uint256 amount) external \{\
        totalSupply += amount;\
        balanceOf[to] += amount;\
        emit Transfer(address(0), to, amount);\
    \}\
    \
    function faucet() external \{\
        uint256 amount = 1000 * 10**6; // 1000 USDT\
        totalSupply += amount;\
        balanceOf[msg.sender] += amount;\
        emit Transfer(address(0), msg.sender, amount);\
    \}\
    \
    function transfer(address to, uint256 amount) external returns (bool) \{\
        require(to != address(0), "Invalid recipient");\
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");\
        \
        balanceOf[msg.sender] -= amount;\
        balanceOf[to] += amount;\
        \
        emit Transfer(msg.sender, to, amount);\
        return true;\
    \}\
    \
    function approve(address spender, uint256 amount) external returns (bool) \{\
        require(spender != address(0), "Invalid spender");\
        \
        allowance[msg.sender][spender] = amount;\
        emit Approval(msg.sender, spender, amount);\
        return true;\
    \}\
    \
    function transferFrom(address from, address to, uint256 amount) \
        external \
        returns (bool) \
    \{\
        require(from != address(0), "Invalid sender");\
        require(to != address(0), "Invalid recipient");\
        require(balanceOf[from] >= amount, "Insufficient balance");\
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");\
        \
        balanceOf[from] -= amount;\
        balanceOf[to] += amount;\
        allowance[from][msg.sender] -= amount;\
        \
        emit Transfer(from, to, amount);\
        return true;\
    \}\
\}\
}
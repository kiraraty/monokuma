// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./BattlePetsNFT.sol";
import "./GameToken.sol";

contract Marketplace is Ownable, ReentrancyGuard {
    BattlePetsNFT public petsNFT;
    GameToken public gameToken;

    // 交易手续费率 (2%)
    uint256 public feeRate = 200; // 基点 (2% = 200)
    uint256 public constant BASIS_POINTS = 10000;

    // 挂单信息
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price;
        uint256 listingTime;
        bool isActive;
    }

    // 拍卖信息
    struct Auction {
        address seller;
        uint256 tokenId;
        uint256 startingPrice;
        uint256 currentBid;
        address highestBidder;
        uint256 endTime;
        bool isActive;
    }

    // 映射：tokenId => 挂单信息
    mapping(uint256 => Listing) public listings;

    // 映射：tokenId => 拍卖信息
    mapping(uint256 => Auction) public auctions;

    // 事件
    event ListingCreated(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event ListingSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );
    event AuctionCreated(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 startingPrice,
        uint256 endTime
    );
    event BidPlaced(
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount
    );
    event AuctionEnded(
        uint256 indexed tokenId,
        address indexed winner,
        uint256 finalPrice
    );

    constructor(address _petsNFT, address _gameToken) Ownable() {
        petsNFT = BattlePetsNFT(_petsNFT);
        gameToken = GameToken(_gameToken);
    }

    // 创建挂单
    function createListing(uint256 tokenId, uint256 price) external {
        require(petsNFT.ownerOf(tokenId) == msg.sender, unicode"不是宠物主人");
        require(price > 0, unicode"价格必须大于0");
        require(!listings[tokenId].isActive, unicode"宠物已在挂单中");
        require(!auctions[tokenId].isActive, unicode"宠物已在拍卖中");

        // 转移宠物到市场合约
        petsNFT.transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            listingTime: block.timestamp,
            isActive: true
        });

        emit ListingCreated(tokenId, msg.sender, price);
    }

    // 取消挂单
    function cancelListing(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, unicode"挂单不存在");
        require(listing.seller == msg.sender, unicode"不是挂单创建者");

        listing.isActive = false;

        // 返还宠物
        petsNFT.transferFrom(address(this), msg.sender, tokenId);

        emit ListingCancelled(tokenId, msg.sender);
    }

    // 购买挂单宠物
    function buyListing(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, unicode"挂单不存在");
        require(msg.sender != listing.seller, unicode"不能购买自己的宠物");
        require(
            gameToken.balanceOf(msg.sender) >= listing.price,
            unicode"代币不足"
        );

        // 扣除代币
        gameToken.transferFrom(msg.sender, address(this), listing.price);

        // 计算手续费
        uint256 fee = (listing.price * feeRate) / BASIS_POINTS;
        uint256 sellerAmount = listing.price - fee;

        // 支付给卖家
        gameToken.transfer(listing.seller, sellerAmount);

        // 转移宠物给买家
        petsNFT.transferFrom(address(this), msg.sender, tokenId);

        // 关闭挂单
        listing.isActive = false;

        emit ListingSold(tokenId, listing.seller, msg.sender, listing.price);
    }

    // 创建拍卖
    function createAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) external {
        require(petsNFT.ownerOf(tokenId) == msg.sender, unicode"不是宠物主人");
        require(startingPrice > 0, unicode"起拍价必须大于0");
        require(
            duration > 0 && duration <= 7 days,
            unicode"拍卖时长必须在1-7天之间"
        );
        require(!listings[tokenId].isActive, unicode"宠物已在挂单中");
        require(!auctions[tokenId].isActive, unicode"宠物已在拍卖中");

        // 转移宠物到市场合约
        petsNFT.transferFrom(msg.sender, address(this), tokenId);

        auctions[tokenId] = Auction({
            seller: msg.sender,
            tokenId: tokenId,
            startingPrice: startingPrice,
            currentBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            isActive: true
        });

        emit AuctionCreated(
            tokenId,
            msg.sender,
            startingPrice,
            block.timestamp + duration
        );
    }

    // 出价
    function placeBid(uint256 tokenId) external nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.isActive, unicode"拍卖不存在");
        require(block.timestamp < auction.endTime, unicode"拍卖已结束");
        require(msg.sender != auction.seller, unicode"卖家不能出价");

        uint256 minBid = auction.currentBid == 0
            ? auction.startingPrice
            : auction.currentBid + ((auction.currentBid * 10) / 100); // 最低加价10%
        require(gameToken.balanceOf(msg.sender) >= minBid, unicode"代币不足");

        // 如果有之前的出价，返还给之前的出价者
        if (auction.highestBidder != address(0)) {
            gameToken.transfer(auction.highestBidder, auction.currentBid);
        }

        // 扣除新出价
        gameToken.transferFrom(msg.sender, address(this), minBid);

        // 更新拍卖信息
        auction.currentBid = minBid;
        auction.highestBidder = msg.sender;

        emit BidPlaced(tokenId, msg.sender, minBid);
    }

    // 结束拍卖
    function endAuction(uint256 tokenId) external nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.isActive, unicode"拍卖不存在");
        require(block.timestamp >= auction.endTime, unicode"拍卖未结束");

        auction.isActive = false;

        if (auction.highestBidder != address(0)) {
            // 有出价者，完成交易
            uint256 fee = (auction.currentBid * feeRate) / BASIS_POINTS;
            uint256 sellerAmount = auction.currentBid - fee;

            // 支付给卖家
            gameToken.transfer(auction.seller, sellerAmount);

            // 转移宠物给最高出价者
            petsNFT.transferFrom(address(this), auction.highestBidder, tokenId);

            emit AuctionEnded(
                tokenId,
                auction.highestBidder,
                auction.currentBid
            );
        } else {
            // 没有出价者，返还宠物给卖家
            petsNFT.transferFrom(address(this), auction.seller, tokenId);

            emit AuctionEnded(tokenId, address(0), 0);
        }
    }

    // 获取挂单信息
    function getListing(
        uint256 tokenId
    ) external view returns (Listing memory) {
        return listings[tokenId];
    }

    // 获取拍卖信息
    function getAuction(
        uint256 tokenId
    ) external view returns (Auction memory) {
        return auctions[tokenId];
    }

    // 设置手续费率
    function setFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 1000, unicode"手续费率不能超过10%");
        feeRate = _feeRate;
    }

    // 提取手续费
    function withdrawFees() external onlyOwner {
        uint256 balance = gameToken.balanceOf(address(this));
        if (balance > 0) {
            gameToken.transfer(owner(), balance);
        }
    }
}

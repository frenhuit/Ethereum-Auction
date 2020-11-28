// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

contract Auction {
    string public item;
    string public itemDescription;
    uint public startPrice;
    address payable public owner;

    uint public currentHighestBidding;
    address payable private currentHighestBuyer;
    uint public lastUpdateTimestamp;
    bool public ended;

    constructor(string memory _item, string memory _itemDescription, uint _startPrice, address payable _owner){
        item = _item;
        itemDescription = _itemDescription;
        startPrice = _startPrice;
        owner = _owner;

        currentHighestBidding = 0;
        currentHighestBuyer = msg.sender;
        lastUpdateTimestamp = block.timestamp;
        ended = false;
    }

    modifier restricted() {
        require(msg.sender == owner, "Only owner can operate.");
        _;
    }

    modifier openAuction() {
        require(!ended, "This auction is ended.");
        _;
    }

    function bid() public payable openAuction{
        require(msg.value > startPrice, "Please bid a higher amount.");
        require(msg.value > currentHighestBidding, "Please bid a higher amount.");
        require(msg.sender != owner, "Can not bid for your own auction product!");
        // Use currentHighestBidding to decide if this is the first bid
        // because address(this).balance has been updated when executing this function
        if (currentHighestBidding > 0) {
            currentHighestBuyer.transfer(currentHighestBidding);
        }
        currentHighestBidding = msg.value;
        currentHighestBuyer = msg.sender;
        lastUpdateTimestamp = block.timestamp;
    }

    function end() public restricted openAuction {
        owner.transfer(address(this).balance);
        ended = true;
    }

    function revoke() public openAuction returns (bool) {
        require(msg.sender == currentHighestBuyer, "Only highest buyer can operate.");
        require(block.timestamp - lastUpdateTimestamp >= 5, "Revoke can only be requested after one week if owner does not confirm and end this auction.");
        currentHighestBuyer.transfer(address(this).balance);
        currentHighestBuyer = owner;
        currentHighestBidding = 0;
        ended = true;
        return true;
    }

    function getSummary() public view returns (
        address, string memory, string memory, uint, address, uint, bool, uint, uint
    ) {
        return (
        owner,
        item,
        itemDescription,
        currentHighestBidding,
        currentHighestBuyer,
        startPrice,
        ended,
        address(this).balance,
        block.timestamp
        );
    }
}

contract AuctionFactory {
    struct AuctionSummary {
        address auctionAddress;
        string item;
        string itemDescription;
        uint startPrice;
    }
    
    address private platform;
    AuctionSummary[] public auctionSummaries;
    event AuctionCreated(address auctionAddress, address ownerAddress);

    constructor() {
        platform = msg.sender;
    }

    function createAuction(string memory _item, string memory _itemDescription, uint _startPrice) public {
        Auction newAuction = new Auction(_item, _itemDescription, _startPrice, msg.sender);
        address newAuctionAddress = address(newAuction);
        AuctionSummary memory auctionSummary = AuctionSummary ({
            auctionAddress: newAuctionAddress,
            item: _item,
            itemDescription: _itemDescription,
            startPrice: _startPrice
        });
        auctionSummaries.push(auctionSummary);
        emit AuctionCreated(newAuctionAddress, msg.sender);
    }

    function getAuctionSummaries() public view returns (AuctionSummary[] memory) {
        return auctionSummaries;
    }
}

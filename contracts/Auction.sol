// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

contract Auction {
    enum AuctionState {OPEN, CONFIRMED, CANCELED, REVOKED, COMPLETED}
    string public item;
    string public itemDescription;
    string public shippingInfo;
    uint256 public startPrice;
    address payable public owner;

    uint256 public currentHighestBidding;
    address payable private currentHighestBuyer;
    uint256 public lastUpdateTimestamp;
    uint256 public confirmTimestamp;
    AuctionState public currentState;

    event AuctionUpdated(address auctionAddress, address sender);

    constructor(
        string memory _item,
        string memory _itemDescription,
        uint256 _startPrice,
        address payable _owner
    ) {
        item = _item;
        itemDescription = _itemDescription;
        startPrice = _startPrice;
        owner = _owner;

        shippingInfo = "";
        currentHighestBidding = 0;
        currentHighestBuyer = msg.sender;
        lastUpdateTimestamp = block.timestamp;
        confirmTimestamp = 0;
        currentState = AuctionState.OPEN;
    }

    modifier restricted() {
        require(msg.sender == owner, "Only owner can operate.");
        _;
    }

    modifier openAuction() {
        require(currentState == AuctionState.OPEN, "This auction is ended.");
        _;
    }

    modifier closeAuction() {
        require(
            currentState != AuctionState.OPEN,
            "This auction is not ended."
        );
        _;
    }

    /** Buyer bid for an open auction */
    function bid() public payable openAuction {
        require(msg.value > startPrice, "Please bid a higher amount.");
        require(
            msg.value > currentHighestBidding,
            "Please bid a higher amount."
        );
        require(
            msg.sender != owner,
            "Can not bid for your own auction product!"
        );
        // Use currentHighestBidding to decide if this is the first bid
        // because address(this).balance has been updated when executing this function
        if (currentHighestBidding > 0) {
            currentHighestBuyer.transfer(currentHighestBidding);
        }
        currentHighestBidding = msg.value;
        currentHighestBuyer = msg.sender;
        lastUpdateTimestamp = block.timestamp;
        emit AuctionUpdated(address(this), msg.sender);
    }

    /** Owner confirm an open auction, prepare to ship */
    function end() public restricted openAuction {
        if (currentHighestBidding > 0) {
            confirmTimestamp = block.timestamp;
            currentState = AuctionState.CONFIRMED;
        } else {
            currentState = AuctionState.CANCELED;
        }
        emit AuctionUpdated(address(this), msg.sender);
    }

    /** Owner update shipping info after shipping */
    function updateShippingInfo(string memory _shippingInfo)
        public
        restricted
        closeAuction
    {
        // update shipping info
        shippingInfo = _shippingInfo;

        // if balance is not empty, transfer to owner
        if (address(this).balance > 0) {
            owner.transfer(address(this).balance);
        }

        currentState = AuctionState.COMPLETED;
        emit AuctionUpdated(address(this), msg.sender);
    }

    /** Owner cancel an open auction */
    function cancel() public restricted openAuction {
        // owner cancel this auction
        if (currentHighestBidding > 0) {
            currentHighestBuyer.transfer(address(this).balance);
            currentHighestBuyer = owner;
            currentHighestBidding = 0;
        }
        currentState = AuctionState.CANCELED;
        emit AuctionUpdated(address(this), msg.sender);
    }

    /** highest buyer revoke an open or confirmed auction, if owner did not response for a long time */
    function revoke() public {
        // highest buyer revoke this auction
        // due to not confirm or shipping after a period of time
        require(
            msg.sender == currentHighestBuyer,
            "Only highest buyer can operate."
        );
        require(
            currentState == AuctionState.OPEN ||
                currentState == AuctionState.CONFIRMED,
            "Cannot revoke a canceled/completed auction."
        );
        // changes to one week in production enviornment
        require(
            block.timestamp - lastUpdateTimestamp >= 0,
            "Revoke can only be requested after one week if owner does not confirm and end this auction."
        );
        // changes to one week in production enviornment
        require(
            block.timestamp - confirmTimestamp >= 0,
            "Revoke can only be requested after one week if owner does not ship after confirmation."
        );
        currentHighestBuyer.transfer(address(this).balance);
        currentHighestBuyer = owner;
        currentHighestBidding = 0;
        currentState = AuctionState.REVOKED;
        emit AuctionUpdated(address(this), msg.sender);
    }

    /** get auction summary */
    function getSummary()
        public
        view
        returns (
            address,
            string memory,
            string memory,
            uint256,
            address,
            uint256,
            AuctionState,
            string memory
        )
    {
        return (
            owner,
            item,
            itemDescription,
            currentHighestBidding,
            currentHighestBuyer,
            startPrice,
            currentState,
            shippingInfo
        );
    }
}

contract AuctionFactory {
    struct AuctionSummary {
        address auctionAddress;
        string item;
        string itemDescription;
        uint256 startPrice;
    }

    address private platform;
    AuctionSummary[] public auctionSummaries;
    event AuctionCreated(address auctionAddress, address ownerAddress);

    constructor() {
        platform = msg.sender;
    }

    function createAuction(
        string memory _item,
        string memory _itemDescription,
        uint256 _startPrice
    ) public {
        Auction newAuction =
            new Auction(_item, _itemDescription, _startPrice, msg.sender);
        address newAuctionAddress = address(newAuction);
        AuctionSummary memory auctionSummary =
            AuctionSummary({
                auctionAddress: newAuctionAddress,
                item: _item,
                itemDescription: _itemDescription,
                startPrice: _startPrice
            });
        auctionSummaries.push(auctionSummary);
        emit AuctionCreated(newAuctionAddress, msg.sender);
    }

    function getAuctionSummaries()
        public
        view
        returns (AuctionSummary[] memory)
    {
        return auctionSummaries;
    }
}

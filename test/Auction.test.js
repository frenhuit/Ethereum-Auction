// const assert = require("chai").assert;
const helper = require("./truffleTestHelper");
const truffleAssert = require("truffle-assertions");

const AuctionFactory = artifacts.require("AuctionFactory");
const Auction = artifacts.require("Auction");

const ITEM = "item";
const ITEM_DESCRIPTION = "item description";
const START_PRICE = 100;
const OWNER_ACCOUNT = 0;
const OWNER_ACCOUNT_2 = 9;

const BUYER_ACCOUNT_1 = 1;
const BID_AMOUNT_1 = 1000;
const BUYER_ACCOUNT_2 = 2;
const BID_AMOUNT_2 = 2000;
const BUYER_ACCOUNT_3 = 3;
const BID_AMOUNT_LOWER_THAN_BEFORE = 500;
const BID_AMOUNT_LOWER_THAN_START = 50;
const SECONDS_IN_A_WEEK = 604800;

contract("AuctionFactory", (accounts) => {
  before(async () => {
    this.auctionFactory = await AuctionFactory.deployed();
    this.auction = await Auction.deployed();
  });

  it("deploys successful", async () => {
    const address = await this.auctionFactory.address;
    assert.ok(address);
  });

  it("originally contains no auction", async () => {
    const auctions = await this.auctionFactory.getAuctions();
    assert.equal(auctions.length, 0);
  });

  describe("first auction is set up", () => {
    before(async () => {
      this.originalLength = (await this.auctionFactory.getAuctions()).length;
      // this.firstAuctionAddress = await this.auctionFactory.createAuction(
      await this.auctionFactory.createAuction(
        ITEM,
        ITEM_DESCRIPTION,
        START_PRICE,
        { from: accounts[OWNER_ACCOUNT] }
      );
      this.firstAuctionAddress = (await this.auctionFactory.getAuctions())[0];
      this.firstAuction = await Auction.at(this.firstAuctionAddress);
    });

    it("first auction is created successfully", async () => {
      assert.ok(this.firstAuctionAddress);
      const auctions = await this.auctionFactory.getAuctions();
      assert.equal(auctions.length, this.originalLength + 1);
    });

    it("bids an auction successfully", async () => {
      await this.firstAuction.bid({
        from: accounts[BUYER_ACCOUNT_1],
        value: BID_AMOUNT_1,
      });
      summary = await this.firstAuction.getSummary();
      assert.equal(Number(summary[3]), BID_AMOUNT_1);
      assert.equal(summary[4], accounts[BUYER_ACCOUNT_1]);
    });

    it("owner cannot bid", async () => {
      await truffleAssert.reverts(
        this.firstAuction.bid({
          from: accounts[OWNER_ACCOUNT],
          value: BID_AMOUNT_2,
        })
      );
    });

    it("bid amount cannot be lower than start price", async () => {
      await truffleAssert.reverts(
        this.firstAuction.bid({
          from: accounts[BUYER_ACCOUNT_3],
          value: BID_AMOUNT_LOWER_THAN_START,
        })
      );
    });

    it("bid amount cannot be lower than current highest one", async () => {
      await truffleAssert.reverts(
        this.firstAuction.bid({
          from: accounts[BUYER_ACCOUNT_3],
          value: BID_AMOUNT_LOWER_THAN_BEFORE,
        })
      );
    });

    it("other person bids by a higher price", async () => {
      await this.firstAuction.bid({
        from: accounts[BUYER_ACCOUNT_2],
        value: BID_AMOUNT_2,
      });
      summary = await this.firstAuction.getSummary();
      assert.equal(Number(summary[3]), BID_AMOUNT_2);
      assert.equal(summary[4], accounts[BUYER_ACCOUNT_2]);
      assert.equal(Number(summary[3]), Number(summary[6]));
    });

    it("only owner can end", async () => {
      await truffleAssert.reverts(
        this.firstAuction.end({ from: accounts[BUYER_ACCOUNT_1] })
      );
    });

    it("end auction", async () => {
      await this.firstAuction.end({ from: accounts[OWNER_ACCOUNT] });
      summary = await this.firstAuction.getSummary();
      assert.ok(summary[5]);
      assert.equal(Number(summary[6]), 0);
    });

    it("cannot end an ended auction", async () => {
      await truffleAssert.reverts(
        this.firstAuction.end({ from: accounts[OWNER_ACCOUNT] })
      );
    });

    it("cannot bid on an ended auction", async () => {
      await truffleAssert.reverts(
        this.firstAuction.bid({
          from: accounts[BUYER_ACCOUNT_1],
          value: BID_AMOUNT_1,
        })
      );
    });
  });

  describe("second auction: revoke test", () => {
    function timeout(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    before(async () => {
      this.originalLength = (await this.auctionFactory.getAuctions()).length;
      await this.auctionFactory.createAuction(
        ITEM,
        ITEM_DESCRIPTION,
        START_PRICE,
        { from: accounts[OWNER_ACCOUNT_2] }
      );
      this.secondAuctionAddress = (await this.auctionFactory.getAuctions())[1];
      this.secondAuction = await Auction.at(this.secondAuctionAddress);
    });

    it("second auction is created successfully", async () => {
      assert.ok(this.secondAuctionAddress);
      const auctions = await this.auctionFactory.getAuctions();
      assert.equal(auctions.length, this.originalLength + 1);
    });

    it("bids on second auction successfully", async () => {
      await this.secondAuction.bid({
        from: accounts[BUYER_ACCOUNT_1],
        value: BID_AMOUNT_1,
      });
      summary = await this.secondAuction.getSummary();
      assert.equal(Number(summary[3]), BID_AMOUNT_1);
      assert.equal(summary[4], accounts[BUYER_ACCOUNT_1]);
    });

    it("highest buyer cannot revode within 604800s", async () => {
      await truffleAssert.reverts(
        this.secondAuction.revoke({ from: accounts[BUYER_ACCOUNT_1] })
      );
    });

    it("not current highest buyer cannot revoke", async () => {
      // need another block which timestamp is 604800 greater than previous one
      const advancement = SECONDS_IN_A_WEEK * 2;
      await helper.advanceTimeAndBlock(advancement);

      await truffleAssert.reverts(
        this.secondAuction.revoke({ from: accounts[BUYER_ACCOUNT_2] })
      );
    });

    it("highest buyer revoke after 604800 s", async () => {
      await this.secondAuction.revoke({ from: accounts[BUYER_ACCOUNT_1] });
      summary = await this.secondAuction.getSummary();
      assert.ok(summary[5]);
      assert.equal(Number(summary[6]), 0);
    });

    it("buyer cannot revoke an ended auction", async () => {
      await truffleAssert.reverts(
        this.secondAuction.revoke({ from: accounts[BUYER_ACCOUNT_1] })
      );
    });
  });
});

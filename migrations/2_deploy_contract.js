const AuctionFactory = artifacts.require("AuctionFactory");
const Auction = artifacts.require("Auction");
const fs = require("fs");
const path = require("path");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(AuctionFactory);
};

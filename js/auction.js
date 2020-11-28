import web3 from "./web3";
const contract = require("truffle-contract");
const auctionJson = require("../build/contracts/Auction.json");

const auctionContract = contract(auctionJson);

auctionContract.setProvider(web3.currentProvider);

export default auctionContract;

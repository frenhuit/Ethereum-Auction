import web3 from "./web3";
const contract = require("truffle-contract");
const auctionFactoryJson = require("../build/contracts/AuctionFactory.json");

const auctionFactoryContract = contract(auctionFactoryJson);
var address_key = Object.keys(auctionFactoryJson["networks"])[0];
var factory_address = auctionFactoryJson["networks"][address_key]["address"];
var factoryInstanceFuture;

auctionFactoryContract.setProvider(web3.currentProvider);
factoryInstanceFuture = auctionFactoryContract.at(factory_address);

export default factoryInstanceFuture;

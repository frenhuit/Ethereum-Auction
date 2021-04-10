import web3 from "./web3";
const NETWORK_ID_RINKEBY = "4";
const NETWORK_ID_LOCAL = "5777";

const contract = require("truffle-contract");
const auctionFactoryJson = require("../build/contracts/AuctionFactory.json");

const auctionFactoryContract = contract(auctionFactoryJson);
var factory_address = auctionFactoryJson["networks"][NETWORK_ID_RINKEBY]["address"];
var factoryInstanceFuture;

auctionFactoryContract.setProvider(web3.currentProvider);
factoryInstanceFuture = auctionFactoryContract.at(factory_address);

export default factoryInstanceFuture;

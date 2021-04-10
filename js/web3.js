import Web3 from "web3";

let web3;

if (typeof window !== "undefined" && typeof window.ethereum !== 'undefined') {
  // We are in the browser and metamask is running.
  web3 = new Web3(window.web3.currentProvider);
} else {
  // We are on the server *OR* the user is not running metamask
  const provider = new Web3.providers.WebsocketProvider("wss://rinkeby.infura.io/ws/v3/7042076252e84486934d1028f3a6b4d8");
  // const provider = new Web3.providers.WebsocketProvider("ws://10.0.0.234:7545");
  web3 = new Web3(provider);
}

export default web3;

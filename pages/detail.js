import Auction from "../js/auction";
import AuctionState from "../js/AuctionState";
import React, { Component } from "react";
import { Button, Form, Input, Message, Card } from "semantic-ui-react";
import web3 from "../js/web3";
import Layout from "../components/Layout";
import { Router } from "../js/routes";
import { showAuctionState } from "../js/showAuctionState";

class AuctionDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      biddingAmount: 0,
      buyer: "",
      loading: false,
      errorMessage: "",
      currentHighestBidding: props.currentHighestBidding,
      currentHighestBuyer: props.currentHighestBuyer,
      auctionState: props.auctionState,
      shippingInfo: props.shippingInfo,
      currentAccount: props.currentAccount,
    };
  }

  static async getInitialProps(props) {
    if (typeof window !== "undefined" && typeof window.ethereum !== 'undefined') {
      if (!("ethereum" in window) || !ethereum.isMetaMask) {
        alert("Please install MetaMask.");
        Router.pushRoute(`/`);
        return;
      }
      await ethereum
        .request({ method: "eth_requestAccounts" })
        .catch((err) => {
          if (err.code === 4001) {
            // EIP-1193 userRejectedRequest error
            // If this happens, the user rejected the connection request.
            alert("Please connect to MetaMask.");
            Router.pushRoute(`/`);
            return;
          } else {
            console.error(err);
          }
        });
    }


    const auction = await Auction.at(props.query.address);
    var summary = await auction.getSummary();
    const accounts = await web3.eth.getAccounts();
    const currentAccount = accounts[0];

    return {
      address: props.query.address,
      owner: summary[0],
      item: summary[1],
      itemDescription: summary[2],
      currentHighestBidding: Number(summary[3]),
      currentHighestBuyer: summary[4],
      startPrice: Number(summary[5]),
      auctionState: Number(summary[6]),
      shippingInfo: summary[7],
      currentAccount: currentAccount,
    };
  }

  componentDidMount() {
    if (!("ethereum" in window) || !ethereum.isMetaMask) {
      alert("Please install MetaMask.");
      Router.pushRoute(`/`);
      return;
    }
    ethereum.on('accountsChanged', (accounts) => {
      // Handle the new accounts, or lack thereof.
      // "accounts" will always be an array, but it can be empty.
      this.setState({ currentAccount: accounts[0] });
    });
    this.timerID = setInterval(async () => {
      // update highest bidding and auction status each 15 seconds
      const auctionInstance = await Auction.at(this.props.address);
      const newSummary = await auctionInstance.getSummary();
      if (
        this.state.currentHighestBidding < Number(newSummary[3]) ||
        this.state.auctionState !== Number(newSummary[6])
      ) {
        // update if others bid a higher amount or the auction is ended
        this.setState({
          currentHighestBidding: Number(newSummary[3]),
          currentHighestBuyer: newSummary[4],
          auctionState: Number(newSummary[6]),
          shippingInfo: newSummary[7]
        });
      }
    }, 15000);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  /**
   * Submits bidding price when user click button 'bid!'
   * @param {*} event 
   */
  onSubmit = async (event) => {
    const biddingAmount = document.getElementById("bidding_price").value;

    try {
      const auctionInstance = await Auction.at(this.props.address);
      await auctionInstance.bid({
        from: this.state.currentAccount,
        value: biddingAmount,
      });
      this.setState({
        errorMessage: "",
        currentHighestBidding: biddingAmount,
        currentHighestBuyer: this.state.currentAccount
      });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  /**
   * Updates shipping info when user click button 'Update shipping info' 
   * @param {*} event 
   */
  updateShippingInfo = async (event) => {
    const shippingMsg = document.getElementById("shipping_info").value;
    try {
      const auctionInstance = await Auction.at(this.props.address);
      await auctionInstance.updateShippingInfo(shippingMsg,
        { from: this.state.currentAccount });
      this.setState({ errorMessage: "", shippingInfo: shippingMsg, auctionState: AuctionState.COMPLETED });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  }

  /**
   * Transfers money back to highest buyer when user click button 'Revoke'
   */
  revoke = async () => {
    try {
      const auctionInstance = await Auction.at(this.props.address);
      await auctionInstance.revoke({
        from: this.state.currentAccount,
      });
      this.setState({ errorMessage: "", auctionState: AuctionState.REVOKED });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  /**
   * Confirms this auction when seller click button 'End'
   */
  end = async () => {
    try {
      const auctionInstance = await Auction.at(this.props.address);
      await auctionInstance.end({
        from: this.state.currentAccount,
      });
      this.setState({
        errorMessage: "",
        auctionState: this.state.currentHighestBidding > 0 ? AuctionState.CONFIRMED : AuctionState.CANCELED
      });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  /**
   * Cancels this auction, transfers the money back to highest buyer when seller click button 'Cancel'
   */
  cancel = async () => {
    try {
      const auctionInstance = await Auction.at(this.props.address);
      await auctionInstance.cancel({
        from: this.state.currentAccount,
      });
      this.setState({ errorMessage: "", auctionState: AuctionState.CANCELED });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  /**
   * Shows item information, includes owner address, highest bidding price, status, and shipping information
   */
  renderDetails() {
    var { owner, item, itemDescription, startPrice } = this.props;

    return (
      <div>
        <h2>{item}</h2>
        <h4>Owner: {owner}</h4>
        <hr></hr>
        <p>{itemDescription}</p>
        <p>
          Current Highest Bidding:{" "}
          <strong>
            {this.state.currentHighestBidding == 0
              ? startPrice
              : this.state.currentHighestBidding}
          </strong>
        </p>
        <p>
          Status: <strong>{showAuctionState(this.state.auctionState)}</strong>
        </p>
        {(this.state.auctionState === AuctionState.CONFIRMED || this.state.auctionState === AuctionState.COMPLETED) && (
          <p>
            Shipping: {this.state.shippingInfo}
          </p>
        )}
      </div>
    );
  }

  render() {
    return (
      <Layout>
        {this.renderDetails()}
        <div>
          {this.state.auctionState === AuctionState.OPEN && this.state.currentAccount !== this.props.owner && (
            <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
              <Form.Field>
                <Input id="bidding_price" label="Bidding Price" />
              </Form.Field>
              <Message error header="Oops!" content={this.state.errorMessage} />
              <div>
                <Button loading={this.state.loading} primary>
                  Bid!
                </Button>
              </div>
            </Form>
          )}
        </div>
        <div>
          {this.state.auctionState === AuctionState.OPEN && this.state.currentAccount === this.props.owner && (
            <Button onClick={this.end} loading={this.state.loading}>
              End
            </Button>
          )}
          {this.state.auctionState === AuctionState.OPEN && this.state.currentAccount === this.props.owner && (
            <Button onClick={this.cancel} loading={this.state.loading}>
              Cancel
            </Button>
          )}
          {(this.state.auctionState === AuctionState.CONFIRMED || this.state.auctionState === AuctionState.OPEN) && this.state.currentAccount === this.state.currentHighestBuyer && (
            <Button onClick={this.revoke} loading={this.state.loading}>
              Revoke
            </Button>
          )}
        </div>
        <div>
          {(this.state.auctionState === AuctionState.CONFIRMED || this.state.auctionState === AuctionState.COMPLETED) && this.state.currentAccount === this.props.owner && (
            <Form onSubmit={this.updateShippingInfo} error={!!this.state.errorMessage}>
              <Form.Field>
                <Input id="shipping_info" label="Package tracking #" />
              </Form.Field>
              <Message error header="Oops!" content={this.state.errorMessage} />
              <div>
                <Button loading={this.state.loading} primary>
                  Update shipping info
                </Button>
              </div>
            </Form>
          )}
        </div>
      </Layout>
    );
  }
}

export default AuctionDetail;

import Auction from "../js/auction";
import { getCurrentAccount } from "../js/random-account";
import React, { Component } from "react";
import { Button, Form, Input, Message, Card } from "semantic-ui-react";
import web3 from "../js/web3";
import Layout from "../components/Layout";
import { Router } from "../js/routes";

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
      ended: props.ended,
    };
  }

  static async getInitialProps(props) {
    const auction = await Auction.at(props.query.address);

    var summary = await auction.getSummary();

    const accounts = await web3.eth.getAccounts();
    var currentAccount = await getCurrentAccount(props, accounts);

    return {
      address: props.query.address,
      owner: summary[0],
      item: summary[1],
      itemDescription: summary[2],
      currentHighestBidding: Number(summary[3]),
      currentHighestBuyer: summary[4],
      startPrice: Number(summary[5]),
      ended: summary[6],
      currentAccount: currentAccount,
    };
  }

  componentDidMount() {
    this.timerID = setInterval(async () => {
      // update highest bidding and auction status each 15 seconds
      const auctionInstance = await Auction.at(this.props.address);
      const newSummary = await auctionInstance.getSummary();
      if (
        this.state.currentHighestBidding < Number(newSummary[3]) ||
        this.state.ended !== newSummary[6]
      ) {
        // update if others bid a higher amount or the auction is ended
        this.setState({
          currentHighestBidding: Number(newSummary[3]),
          currentHighestBuyer: newSummary[4],
          ended: newSummary[6],
        });
      }
    }, 15000);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  onSubmit = async (event) => {
    const biddingAmount = document.getElementById("bidding_price").value;

    try {
      const auctionInstance = await Auction.at(this.props.address);
      await auctionInstance.bid({
        from: this.props.currentAccount,
        value: biddingAmount,
      });
      this.setState({ errorMessage: "", currentHighestBidding: biddingAmount, currentHighestBuyer: this.props.currentAccount });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  revoke = async () => {
    try {
      const auctionInstance = await Auction.at(this.props.address);
      await auctionInstance.revoke({
        from: this.props.currentAccount,
      });
      this.setState({ errorMessage: "", ended: true });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  end = async () => {
    try {
      const auctionInstance = await Auction.at(this.props.address);
      await auctionInstance.end({
        from: this.props.currentAccount,
      });
      this.setState({ errorMessage: "", ended: true });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  renderDetails() {
    var { owner, item, itemDescription, startPrice } = this.props;

    const items = [
      {
        header: owner,
        meta: "Address of Owner",
        style: { overflowWrap: "break-word" },
      },
      {
        header: item,
        meta: "Item name",
        description: itemDescription,
      },
      {
        header: this.state.currentHighestBidding,
        meta: "Current hightest bidding amount",
        description:
          this.state.currentHighestBidding === 0
            ? ""
            : "Buyer address: " + this.state.currentHighestBuyer,
      },
      {
        header: this.state.ended ? "Ended" : "On progress",
        meta: "Auction status",
      },
    ];

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
          Status: <strong>{this.state.ended ? "Ended" : "On progress"}</strong>
        </p>
      </div>
    );
  }

  render() {
    return (
      <Layout>
        {this.renderDetails()}

        <div>
          {!this.state.ended && this.props.currentAccount !== this.props.owner && (
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
          {!this.state.ended && this.props.currentAccount === this.props.owner && (
            <Button onClick={this.end} loading={this.state.loading}>
              End
            </Button>
          )}
          {!this.state.ended && this.props.currentAccount === this.state.currentHighestBuyer && (
            <Button onClick={this.revoke} loading={this.state.loading}>
              Revoke
            </Button>
          )}
        </div>
      </Layout>
    );
  }
}

export default AuctionDetail;

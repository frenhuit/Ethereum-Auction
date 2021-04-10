import React, { Component } from "react";
import { Button, Form, Input, Message } from "semantic-ui-react";
import factoryInstanceFuture from "../js/factory";
import Layout from "../components/Layout";
import { Router } from "../js/routes";
import web3 from "../js/web3";


class AuctionNew extends Component {
  state = {
    item: "",
    itemDescription: "",
    startPrice: 0,
    loading: false,
    errorMessage: "",
    currentAccount: this.props.currentAccount,
  };

  static async getInitialProps(props) {
    if (typeof window !== "undefined" && typeof window.ethereum !== 'undefined') {
      await ethereum
        .request({ method: "eth_requestAccounts" })
        .catch((err) => {
          if (err.code === 4001) {
            // EIP-1193 userRejectedRequest error
            // If this happens, the user rejected the connection request.
            console.log("Please connect to MetaMask.");
            alert("Please connect to MetaMask.");
            Router.pushRoute(`/`);
            return;
          } else {
            console.error(err);
          }
        });
    }

    const accounts = await web3.eth.getAccounts();
    var currentAccount = accounts[0];
    return { currentAccount: currentAccount };
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
  }

  onSubmit = async (event) => {
    event.preventDefault();
    this.setState({ loading: true, errorMessage: "" });

    try {
      const factoryInstance = await factoryInstanceFuture;
      factoryInstance.AuctionCreated((error, result) => {
        if (!error && this.state.currentAccount === result.returnValues[1]) {
          Router.pushRoute(`/detail/${result.returnValues[0]}`);
        }
      });
      await factoryInstance.createAuction(
        this.state.item,
        this.state.itemDescription,
        this.state.startPrice,
        { from: this.state.currentAccount }
      );
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    return (
      <Layout>
        <h3>Create an auction</h3>
        <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
          <Form.Field>
            <label>Item Name</label>
            <Input
              label="item"
              labelPosition="right"
              value={this.state.item}
              onChange={(event) => this.setState({ item: event.target.value })}
            />
          </Form.Field>
          <Form.Field>
            <label>Item Description</label>
            <Input
              label="description"
              labelPosition="right"
              value={this.state.description}
              onChange={(event) =>
                this.setState({ itemDescription: event.target.value })
              }
            />
          </Form.Field>
          <Form.Field>
            <label>Start Price</label>
            <Input
              type="number"
              label="price"
              labelPosition="right"
              value={this.state.startPrice}
              onChange={(event) =>
                this.setState({
                  startPrice: parseInt(event.target.value),
                })
              }
            />
          </Form.Field>
          <Message error header="Oops!" content={this.state.errorMessage} />
          <Button loading={this.state.loading} primary>
            Create!
          </Button>
        </Form>
      </Layout>
    );
  }
}

export default AuctionNew;

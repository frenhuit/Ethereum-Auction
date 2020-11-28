import React, { Component } from "react";
import { Button, Form, Input, Message } from "semantic-ui-react";
import factoryInstanceFuture from "../js/factory";
import { getCurrentAccount } from "../js/random-account";
import web3 from "../js/web3";
import Layout from "../components/Layout";
import { Router } from "../js/routes";


class AuctionNew extends Component {
  state = {
    item: "",
    itemDescription: "",
    startPrice: 0,
    loading: false,
    errorMessage: "",
  };

  static async getInitialProps(props) {
    const accounts = await web3.eth.getAccounts();
    const currentAccount = await getCurrentAccount(props, accounts);
    
    return { currentAccount: currentAccount };
  }

  onSubmit = async (event) => {
    event.preventDefault();
    this.setState({ loading: true, errorMessage: "" });

    try {
      const factoryInstance = await factoryInstanceFuture;
      factoryInstance.AuctionCreated((error, result) => {
        if (!error && this.props.currentAccount === result.returnValues[1]) {
          Router.pushRoute(`/detail/${result.returnValues[0]}`);
        }
      });
      await factoryInstance.createAuction(
        this.state.item,
        this.state.itemDescription,
        this.state.startPrice,
        { from: this.props.currentAccount }
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

import React, { Component } from "react";
import { Card, Button } from "semantic-ui-react";
import factoryInstanceFuture from "../js/factory";
import Layout from "../components/Layout";
import { Link } from "../js/routes";

class AuctionIndex extends Component {
  static async getInitialProps(props) {
    const factoryContract = await factoryInstanceFuture;
    const auctionSummaries = await factoryContract.getAuctionSummaries();
    return { auctionSummaries };
  }

  renderAuctions() {
    const items = this.props.auctionSummaries.map((summary) => {
      return {
        header: summary[1],
        description: (
          <div>
            <p>Description: {summary[2]}</p>
            <Link route={`/detail/${summary[0]}`}>
              <a>View Auction</a>
            </Link>
          </div>
        ),
        fluid: true,
      };
    });

    return <Card.Group items={items} />;
  }

  render() {
    return (
      <Layout>
        <div>
          <div>
            <h3>Auctions</h3>
            <Link route="/new">
              <a>
                <Button
                  floated="right"
                  content="Create Auction"
                  icon="add circle"
                  primary
                />
              </a>
            </Link>
          </div>
          {this.renderAuctions()}
        </div>
      </Layout>
    );
  }
}

export default AuctionIndex;

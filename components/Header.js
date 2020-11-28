import React from "react";
import { Menu } from "semantic-ui-react";
import { Link } from "../js/routes";

const output = () => {
  return (
    <Menu style={{ marginTop: "10px" }}>
      <Link route="/">
        <a className="item">Ethereum Auction</a>
      </Link>
      <Menu.Menu position="right">
        <Link route="/">
          <a className="item">Auctions</a>
        </Link>
        <Link route="/new">
          <a className="item">+</a>
        </Link>
      </Menu.Menu>
    </Menu>
  );
};

export default output;

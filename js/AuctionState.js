const AuctionState = {
    OPEN: 0,
    CONFIRMED: 1,
    CANCELED: 2,
    REVOKED: 3,
    COMPLETED: 4
}

Object.freeze(AuctionState);

export default AuctionState;
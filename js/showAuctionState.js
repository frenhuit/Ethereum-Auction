import AuctionState from "./AuctionState";

export const showAuctionState = (state) => {
    var result = "";
    switch (state) {
        case AuctionState.OPEN:
            result = 'Open';
            break;
        case AuctionState.CONFIRMED:
            result = 'Confirmed';
            break;
        case AuctionState.CANCELED:
            result = 'Canceled';
            break;
        case AuctionState.REVOKED:
            result = 'Revoked';
            break;
        case AuctionState.COMPLETED:
            result = 'Completed';
            break;
        default:
            result = 'Error';
            break;
    }

    return result;
}
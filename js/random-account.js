import Cookies from "cookies";
import cookieCutter from "cookie-cutter";

export const getCurrentAccount = (props, accounts) => {
    const { req, res } = props;
    if (req != undefined) {
        const serverCookies = new Cookies(req, res);
        var randomNumber = serverCookies.get("randomAccount");
        if (randomNumber === undefined) {
            var randomNumber = Math.floor(Math.random() * accounts.length);
            serverCookies.set("randomAccount", randomNumber, {
                httpOnly: false
            });
        } 
    } else {
        randomNumber = cookieCutter.get("randomAccount");
        if (randomNumber === undefined) {
            var randomNumber = Math.floor(Math.random() * accounts.length);
            cookieCutter.set("randomAccount", randomNumber);
        }
    }

    return accounts[randomNumber];
}
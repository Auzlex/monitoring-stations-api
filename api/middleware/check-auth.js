const jwt = require("jsonwebtoken");

// default middleware pattern for express apps
module.exports = (req, res, next) => {

    // try decode the token
    try
    {
        const token = req.headers.authorization.split(" ")[1]; // "bearer token", as expected input
        //console.log(token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // grab the token from the body
        req.userData = decoded; // allows extraction of user data from the decoded response.
        next(); // call this only if we successfully authenticate
    } 
    catch(error)
    {
        // return error status 401 which is unauthorized 
        return res.status(401).json({
            message: "Not authed."
        })
    }
};
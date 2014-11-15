/**
 * Created by Simon on 6/8/14.
 */

/**
 * isLoggedIn
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
"use strict";
module.exports = function(req, res, next) {

    // User is allowed, proceed to the next policy,
    // or if this is the last policy, the controller
    if (typeof req.session === 'object' && req.session.authenticated) {
        return next();
    } else {
        sails.log.error(typeof req.session, 'Type of req.session');
        res.redirect('/login');
    }
};

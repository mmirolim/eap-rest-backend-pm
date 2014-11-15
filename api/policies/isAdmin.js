/**
 * Created by PhpStorm.
 * Author: Mirolim Mirzakhmedov
 * Date: 19.07.14
 * Time: 14:52
 * Policy to check if user is Admin
 */
"use strict";
module.exports = function (req, res, next) {

    if ( req.session.user.role === 'admin' ) {
        return next();
    } else {
        res.json({msgType: "warning", code: 403, msg: "I'm sorry but your are not eligible to do it"}, 403);
    }

};
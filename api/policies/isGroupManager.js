/**
 * Created by PhpStorm.
 * Author: Mirolim Mirzakhmedov
 * Date: 19.07.14
 * Time: 14:52
 * Policy to check if user is group manager
 */
"use strict";
module.exports = function (req, res, next) {
    var groupId = parseInt(req.param('id'));
    var user = req.session.user;
    // check if user's group or child group is requested and he is a manager.
    if (( user.grp === groupId || ( !!user.groups && user.groups.indexOf(groupId) )) && user.role === 'manager' ) {
        return next();
    } else {
        res.json({msgType: "warning", code: 403, msg: "I'm sorry but your are not eligible to do it"}, 403);
    }

};
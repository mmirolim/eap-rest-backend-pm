/**
 * Created by PhpStorm.
 * Author: Mirolim Mirzakhmedov
 * Date: 19.07.14
 * Time: 14:52
 * Policy to check if user is group manager
 */
"use strict";
module.exports = function (req, res, next) {
    var projectId = parseInt(req.param('id'));
    var user = req.session.user;
    // check if user's group or child group is requested and he is a manager.
    if ( !!user.projects && !!_.findIndex(user.projects, function (o) { return o.id === projectId && o.isManager })) {
        return next();
    } else {
        res.json({msgType: "warning", code: 403, msg: "You are not a manager in that project"}, 403);
    }

};
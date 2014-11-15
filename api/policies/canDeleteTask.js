/**
 * Created by PhpStorm.
 * Author: Mirolim Mirzakhmedov
 * Date: 12.07.14
 * Time: 14:52
 * Policy to check if user can delete particular task
 */
"use strict";
module.exports = function (req, res, next) {
    // only users who created task or admin can delete it
    // id should be number
    var id = parseInt(req.param('id'));
    Task.findOne({id: id}).exec(function (err, task) {
        // check if task exists
        if (typeof task === 'undefined') {
            return res.json({msgType: "warning", code: 404, msg: "Task not found"}, 404);
        }
        if (!err) {
            if ( task.createdBy === req.session.user.id || req.session.user.role === 'admin' ) {
                return next();
            } else {
                res.json({msgType: "warning", code: 403, msg: "Task delete forbidden"}, 403);
            }
        } else {
            console.log(err, 'Error in findOne Task canDelete policy');
            res.json(err);
        }
    });

};
/**
 * Created by PhpStorm.
 * Author: Mirolim Mirzakhmedov
 * Date: 12.07.14
 * Time: 16:38
 * Policy to search if user can assing task to other users
 */
"use strict";
module.exports = function (req, res, next){
    // only users who created task or admin can delete it
    // id should be Int
    var id = parseInt(req.param('id'));
    // get task to update and
    // store assigned user id
    var assignedTo, updatedTask = req.body;

    var user = req.session.user;
    // find old task
    Task.findOne({id: id}).exec(function (err, task) {
        if (!err) {
            // check if task exists
            if (typeof task === 'undefined') {
                return res.json({msgType: "warning", code: 404, msg: "Task not found"}, 404);
            }
            // check what props changed and strip objects, I assume if props are objects then props
            // are not changed it just populated data
            _(updatedTask).forEach( function (v, k) {
                if (!Task.attributes.hasOwnProperty(k)) {
                    delete updatedTask[k];
                }
                // if we got array then delete collections
                if (_.isArray(task[k])) {
                    delete updatedTask[k];
                }
                // if prop is object, assume it populated from association
                if (_.isObject(updatedTask[k]) && updatedTask[k].hasOwnProperty('id')) {
                    updatedTask[k] = updatedTask[k].id;
                }

            });

            // if update is assigning to person not grp or project
            // managers can assing to all user and current user can assign to himself
            // two ways if role user and if role manager || top || admin
            // user can assign to projects and groups only his own tasks
            switch (user.role) {
                case 'user':
                    // assign to oneself
                    if (updatedTask.assignedTo === user.id || (task.createdBy === user.id && (!updatedTask.assignedTo || (updatedTask.assignedTo === task.assignedTo)))) {
                        return next();
                    } else {
                        return res.json({msgType: "warning", code: 403, msg: "Task assign forbidden"}, 403);
                    }
                    break;
                // fallthrough
                case 'manager':
                case 'top':
                case 'admin':
                    return next();
                    break;
                default :
                    return res.json({msgType: "warning", code: 403, msg: "Task assign forbidden"}, 403);
            }


        } else {
            console.log(err, 'Error in findOne Task canAssign policy');
            res.json(err);
        }
    });

};
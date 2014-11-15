/**
 * CommentController
 * @author      :: Mirolim Mirzakhmedov mirolim777 at gmail dot com
 * @description :: Server-side logic for managing comments
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
"use strict";
module.exports = {
    create : function (req, res) {
        var newComment = req.body;
        // we need task id and comment text
        if (!newComment.hasOwnProperty('task') || !newComment.hasOwnProperty('text')) {
            return res.json({msgType: "warning", code: 400, msg: "Comment task/text missing"}, 400);
        }
        // and they should not be empty
        if (!_.isNumber(newComment.task) || _.isEmpty(newComment.text)) {
            return res.json({msgType: "warning", code: 400, msg: "Comment task/text empty"}, 400);
        }
        // fix problem with sails crash (waterline) when model send with extra fields
        // clean obj before so sails will not crash, should be cleaned in CommentController actions update and create
        _(newComment).forEach( function (v, k) {
            if (!Comment.attributes.hasOwnProperty(k)) {
                delete newComment[k];
            }
        });
        newComment.createdBy = req.session.user.id;
        // check if task referenced in comment exists
        Task.findOne({id: newComment.task})
            .then(function (task) {
                // check if task exists
                if (typeof task === 'undefined') {
                    return res.json({msgType: "warning", code: 404, msg: "Task not found"}, 404);
                }
                Comment.create(newComment).exec( function (err, comment) {
                    if (err) {
                        return res.json(err);
                    } else {
                        Comment.findOne({id: comment.id})
                            .populate('createdBy')
                            .populate('task') // populate task to get grp and project where comment created
                            .then(function (comment) {
                                // check if req.isSocket true according to sails doc
                                if ( req.isSocket === true ) {
                                    var data = {
                                        id: task.id,
                                        data: task,
                                        verb: 'commentAdded'
                                    };
                                    if (!!task.grp) {
                                        sails.sockets.broadcast("groupID#" + task.grp,'task', data);
                                    }
                                    if (!!task.project) {
                                        sails.sockets.broadcast("projectID#"+ task.project,'task', data);
                                    }
                                    // if assigned user deleted it don't emit msg to his socket via personal room
                                    if (!!task.assignedTo) {
                                        sails.sockets.broadcast("userID#" + task.assignedTo, 'task', data);
                                    }
                                    // send to task creater
                                    if (!!task.createdBy) {
                                        sails.sockets.broadcast("userID#" + task.createdBy, 'task', data);
                                    }
                                }
                                // @todo does we need it?
                                res.json(comment);
                            })
                            .fail(function (err) {
                                res.json(err);
                            });

                    }
                });
            })
            .fail(function (err) {
                res.json(err);
            });

    }
};
/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @author      :: Ramil
 * @date        :: 2014/06/24
 */
"use strict";

module.exports = {

    profile: function (req, res) {
        return res.view();
    },

    tasks: function (req, res) {
        var allParams = req.allParams();
        var userId = parseInt(req.param('id'));
        // check if number
        if (isNaN(userId)) {
            return res.json({msgType: "warning", code: 404, msg: "User id missing"}, 404);
        }
        // query parser
        var criteria = ParserService.parseGetParams(allParams);  
        Task.find({assignedTo: userId})
            .populate('grp')
            .populate('project')
            .populate('createdBy')
            .populate('comments')
            .populate('files')
            .populate('assignedTo')
            .populate('children')
            .then(function (tasks) {
                // check if task exists
                if (_.isEmpty(tasks)) {
                    return res.json({msgType: "warning", code: 404, msg: "Task not found"}, 404);
                }
                res.json(tasks);
            })
            .fail(function (err) {
                sails.log.error(err, 'UserCtrl.tasks');
            });
    },
    // get all user's projects
    projects: function (req, res) {
        var userId = parseInt(req.param('id'));
        // check if number
        if (isNaN(userId)) {
            return res.json({msgType: "warning", code: 404, msg: "User id missing"}, 404);
        }
        User.getProjects(userId, function (err, projects) {
            if (!err) {
                res.json(projects);
            } else {
                res.json(err, 404);
            }
        });

    },
    groups: function (req, res) {
        var userId = parseInt(req.param('id'));
        // check if number
        if (isNaN(userId)) {
            return res.json({msgType: "warning", code: 404, msg: "User id missing"}, 404);
        }
        User.getGroups(userId, function (err, groups) {
            if (!err) {
                res.json(groups);
            } else {
                res.json(err, 404);
            }
        });
    }
    
    
};


/**
 * ProjectController
 *
 * @description :: Server-side logic for managing Projects
 * @author      :: Ramil
 * @date        :: 2014/06/24
 */
"use strict";
module.exports = {
    tasks: function (req, res) {
        var allParams = req.allParams();
        // should be Int
        var projectId = parseInt(req.param('id'));
        // check if number
        if (isNaN(projectId)) {
            return res.json({msgType: "warning", code: 404, msg: "Project id missing"}, 404);
        }
        // query parser
        var criteria = ParserService.parseGetParams(allParams);
        Project.getTasks(projectId, criteria, function(tasks, err){
            if(err !== undefined){
                return res.json({msg:"Error: "+err});
            }
            res.json(tasks);
        });
    },
    users: function (req, res) {
        var allParams = req.allParams();
        // should be Int
        var projectId = parseInt(req.param('id'));
        // check if number
        if (isNaN(projectId)) {
            return res.json({msgType: "warning", code: 404, msg: "Project id missing"}, 404);
        }
        // query parser
        var criteria = ParserService.parseGetParams(allParams);
        Project.getUsers(projectId, criteria, function (users, err){
            if ( err !== undefined ){
                return res.json({msg:"Error: "+err});
            }
            res.json(users);
        });        
    },
    // overide default find action
    find: function (req, res) {
        var allParams = req.allParams();
        var projectId = req.param('id');
        // query parser
        var criteria = ParserService.parseGetParams(allParams);
        // Find projects for current user
        Project.find(criteria)
            .then(function (projects) {
                // check if there is users in project
                if (_.isEmpty(projects)) {
                    return res.json({msgType: "warning", code: 404, msg: "Project not found"}, 404);
                }
                res.json(projects);
            })
            .fail(function (err) {
                return res.json(err);
            });

    },
    dependent: function (req, res) {
        // id
        var projectId = parseInt(req.param('id'));
        // check if number
        if (isNaN(projectId)) {
            return res.json({msgType: "warning", code: 404, msg: "Project id missing"}, 404);
        }
        UserProject.find({project: projectId})
            .then(function(usersRow) {
                // check if there is users in project
                if (_.isEmpty(usersRow)) {
                    return res.json({msgType: "warning", code: 404, msg: "No user in project not found"}, 404);
                }
                var userIds = _.map(usersRow, 'user');
                User.find({id: userIds})
                    .then(function(users) {
                        return res.json(users);
                    });
            })
            .fail(function(err) {
                sails.log.error(err, 'ProjectCtrl.dependent');
                return res.json(err);
            })
    }

};

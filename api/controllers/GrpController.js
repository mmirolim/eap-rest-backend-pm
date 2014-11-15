/**
 * GrpController
 *
 * @description :: Server-side logic for managing Groups
 *
 */
"use strict";
module.exports = {
	tasks: function (req, res) {
        var allParams = req.allParams();
        // should be Int
        var groupId = parseInt(req.param('id'));
        // check if group number
        if (isNaN(groupId)) {
            return res.json({msgType: "warning", code: 404, msg: "Group id missing"}, 404);
        }
        // query parser
        var criteria = ParserService.parseGetParams(allParams);
        Grp.getTasks(groupId, criteria, function (tasks, err) {
            if(err !== undefined){
                res.json({msg:"Error: "+err});
            }
            // @todo maybe send it via sockets?
            res.json(tasks);
        });
    },
    users: function (req, res) {
        var allParams = req.allParams();
        // should be Int
        var groupId = parseInt(req.param('id'));
        // check if group number
        if (isNaN(groupId)) {
            return res.json({msgType: "warning", code: 404, msg: "Group id missing"}, 404);
        }
        // query parser
        var criteria = ParserService.parseGetParams(allParams); 

        Grp.getUsers(groupId, criteria, function (users, err) {
            if(err !== undefined){
                res.json({msg:"Error: "+err});
            }
            res.json(users);
        });        
    },
    // overide default find action
    find: function (req, res) {
        // query parser
        var criteria = ParserService.parseGetParams(req.allParams());
        // @todo support search with criteria, currently find by id
        if (_.isEmpty(criteria)) {
            criteria = {id: 1};
        }
        Grp.find(criteria)
            .then(function (groups) {
                // check if groups exists
                if (_.isEmpty(groups)) {
                    return res.json({msgType: "warning", code: 404, msg: "Group not found"}, 404);
                }
                res.json(groups);
            })
            .fail(function (err) {
                return res.json(err);
            });

    },
    // get all dependent entities for particular group
    dependent: function (req, res) {
        var allParams = req.allParams();
        // should be Int
        var groupId = parseInt(req.param('id'));
        // check if group number
        if (isNaN(groupId)) {
            return res.json({msgType: "warning", code: 404, msg: "Group id missing"}, 404);
        }
        // query parser
        var criteria = ParserService.parseGetParams(allParams);
        Grp.findOne({id: groupId})
            .populate('children')
            .then(function (group) {
                // check if group exists
                if (typeof group === 'undefined') {
                    return res.json({msgType: "warning", code: 404, msg: "Group not found"}, 404);
                }
                // find all slaves of current user
                User.findOne({id: req.session.user.id})
                    .populate('slaves')
                    .then(function (user) {
                        // find all users in group
                        User.find({grp: groupId})
                            .then(function (users) {
                                // set all group users
                                // @todo find why waterline does not like users, I cant add property users
                                group.employees = users;
                                // set current user and his slaves
                                group.user = user;
                                res.json(group);
                            })
                            .fail(function (err) {
                                console.log(err, 'Err Grp.Ctrl.dependent User.find');
                                res.json(err);
                            });

                    })
                    .fail(function (err) {
                        console.log(err, 'Err Grp.Ctrl.dependent User.findOne');
                        res.json(err);
                    });
            })
            .fail(function (err) {
                console.log(err, "Err in GrpCtrl.dependent");
                res.json(err);
            });

    }
};


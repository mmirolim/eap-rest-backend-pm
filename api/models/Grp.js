/**
* Grp.js
* Author: Mirolim Mirzakhmedov
* Date: 12.07.14
* Time: 16:38
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/
"use strict";
module.exports = {

  attributes: {
      title: {
          type: 'string',
          required: true,
          unique: true
      },
      info: {
          type: 'text'
      },
      createdBy : {
          type: 'integer',
          columnName: 'created_by'
      },
      createdAt: {
          type: 'datetime',
          columnName: 'created_at'
      },
      updatedAt: {
          type: 'datetime',
          columnName: 'updated_at'
      },
      parent: {
          model: 'Grp',
          columnName: 'parent_id',
          index:true
      },
      children: {
          collection: 'Grp',
          via: 'parent'
      },
      // collection of users in group
      users: {
          collection: 'User',
          via: 'grp'
      },
      // collection of tasks in group
      tasks: {
          collection: 'Task',
          via: 'grp'
      }
  },
  getTasks : function (groupId, criteria, next) {
        var start = process.hrtime();
        // complete tasks not longer than 2 weeks ago
        var week = 1000*60*60*24*7;
        var twoWeeksAgo = Date.now() - 2*week;
        twoWeeksAgo = new Date(twoWeeksAgo);
        twoWeeksAgo = twoWeeksAgo.toISOString();
        // @todo use criteria (currently not used)
        // by default sort by priority and date and limit finished tasks by two weeks
        this.findOne(groupId)
            .then(function(group) {
                // check if group exists
                if (typeof group === 'undefined') {
                    return res.json({msgType: "warning", code: 404, msg: "Group not found"}, 404);
                }
            // @todo maybe use digits instead of words, it will be more flexible
            // populate task with status 'inbox', 'active'
            Task.find({sort: {updatedAt: 'DESC', priority: 'DESC'}, where: {grp: groupId, status:['inbox','active']}})
            .then(function (tasksByGroupId) {
                // Get all users ids in group
                User.find({grp:groupId})
                    .then(function (users) {
                        // get all users ids
                        var usersIds = _.map(users, 'id');
                        var tasksByUsers = [], tasksFinishedByUsers = [];
                        // Use Q promises logic
                        // get all tasks (inbox, active, complete) created by group members
                        if (!_.isEmpty(users)) {
                            // find tasks created by group members
                            tasksByUsers = Task.find({sort: 'priority DESC and updatedAt ASC', where: {createdBy: usersIds, grp: {'!' : groupId}, status:['inbox','active']}})
                                            .then(function (tasksByUsers) {
                                                return tasksByUsers;
                                            });
                            // find completed tasks created by group members in last 2 weeks
                            tasksFinishedByUsers = Task.find({sort: 'updatedAt ASC', where: {createdBy: usersIds, grp: {'!' : groupId}, status: 'complete', updatedAt: {'>': twoWeeksAgo}}})
                                .then(function (tasksFinishedByUsers) {
                                    return tasksFinishedByUsers;
                                });
                        }
                        // find completed tasks by group id in last 2 weeks
                        var tasksFinishedByGroupId = Task.find({sort: 'updatedAt ASC', where: {grp: groupId, status: 'complete', updatedAt: {'>': twoWeeksAgo}}})
                                                        .then(function (tasksFinishedByGroupId) {
                                                            return tasksFinishedByGroupId;
                                                        });

                        // return promise results
                        return [tasksByGroupId, tasksByUsers, tasksFinishedByGroupId, tasksFinishedByUsers];
                    })
                    .spread(function (tasksByGroupId, tasksByUsers, tasksFinishedByGroupId, tasksFinishedByUsers) {
                        // get all tasks ids
                        var taskIds = _.map(tasksByGroupId.concat(tasksByUsers, tasksFinishedByGroupId, tasksFinishedByUsers), 'id');
                        Task.find({id: taskIds})
                            .populate('grp')
                            .populate('project')
                            .populate('createdBy')
                            .populate('comments')
                            .populate('assignedTo')
                            .populate('children') // @todo find why children should be last (otherwise empty)
                            .then(function (allTasks) {
                                // join all results
                                var groupTasks = {
                                    id: group.id,
                                    createdAt: group.createdAt,
                                    updatedAt: group.updatedAt,
                                    title: group.title,
                                    info: group.info,
                                    tasks: allTasks,
                                    t: process.hrtime(start) // performance
                                };
                                next(groupTasks, undefined);
                            });

                    })
                    .fail(function (err) {
                        return res.json(err);
                    });
                })
                .fail(function (err) {
                    return res.json(err);
                });
            })
            .fail(function (err) {
                return res.json(err);
            });

      
  },
  getUsers: function (groupId, criteria, next) {
        //@todo for users in group there should not be limits
        //User
        User.find()
            .where({grp: groupId})
            .populate('user', criteria)
            .then(function(users) {
                users = _.flatten(users, 'user');
                next(users);
            })
            .fail(function(err){
                next(undefined, err);
            });
    },
    search : function (q, criteria, next){
      this.find(criteria)
              .where({title:{'like':q+'%'}},{title:{'like':Translit.transliterate(q)+'%'}})
              .then(function(groups){
                  var result=[];
                  for(var group in groups){
                      result.push({type:"group", id:groups[group].id, identity: groups[group].title, data: groups[group]});
                  }
                  next(result);
              })
              .fail(function(err){
                console.log(err, 'Err in search Grp.js');
              });
    }
};


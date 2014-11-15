/**
* Task.js
* Author: Mirolim Mirzakhmedov
* Date: 12.07.14
* Time: 16:38
* @description :: Task model is a core model.
* @docs        :: http://sailsjs.org/#!documentation/models
*/
"use strict";
module.exports = {
    // @todo refactor attributes names where association used from Id to just model (parentTask)
    attributes: {
      title: {
          type: 'string',
          required: true
      },
      status: {
          type: 'string',
          index: true
      },
      createdBy: {
          model: 'User',
          columnName: 'created_by',
          index: true
      },
      updatedBy: {
          model: 'User',
          columnName: 'updated_by',
          index: true
      },
      grp: {
          model: 'Grp',
          columnName: 'grp_id',
          index: true
      },
      assignedTo: {
          model: 'User',
          columnName: 'assigned_to',
          index: true
      },
      createdAt: {
          type: 'datetime',
          columnName: 'created_at',
          index: true
      },
      updatedAt: {
          type: 'datetime',
          columnName: 'updated_at',
          index: true
      },
      project: {
        model: 'Project',
        columnName: 'project_id',
        index: true
      },
      description: {
        type: 'text'
      },
      priority: {
        type : 'integer',
        defaultsTo : 1,
        index: true
      },
      dueDate: {
        type: 'datetime'
      },
      parent: {
        model: 'Task',
        columnName: 'parent_task_id',
        index:true
      },
      comments : {
          collection : 'Comment',
          via : 'task'
      },
      files : {
          collection : 'File',
          via : 'task'
      },
      // add children collection to task model
      children: {
        collection: 'Task',
        via: 'parent'
      }
    },
    afterCreate: function (task, next) {
        // log Task creation
        var log = {
            task: task.id,
            user: task.createdBy,
            action: 'created',
            data: task.title
        };
        TaskLog.create(log).exec(function (err, log) {
            if (err) {
                console.log(err, 'Err in afterCreate Task');
            }
        });
        // forward task
        next();
    },
    // get all relative tasks by recursively search for children and parents
    // @todo if possible refactor this mess
    getTaskTree: function (taskId, next) {
        // @todo refactor to speed up db requests
        var data = [];
        Task.findOne({id: taskId})
            .then(function (task) {
               if (task) {
                    //find parent task
                    if (!_.isNull(task.parent)) {
                        Task.getParent(task.parent, data, next);
                    } else {
                        data.push(task);
                        Task.getChildren(taskId, data, next);
                    }
               }
            })
            .fail(function (err) {
                next(undefined, err);
            });
    },
    getParent: function (parentId, data, next) {
        Task.findOne({id: parentId})
            .then(function (parent) {
                if (!_.isNull(parent.parent)) {
                    Task.getParent(parent.parent, data, next);
                } else {
                    data.push(parent);
                    Task.getChildren(parentId, data, next);
                }
            })
            .fail(function (err) {
                sails.log(err);
            })
    },
    getChildren: function (parentId, data,  next) {
        Task.find({parent: parentId})
            .then(function (tasks) {
                if (!_.isEmpty(tasks)) {
                    _.forEach(tasks, function (task) {
                        data.push(task);
                        Task.getChildren(task.id, data , next);
                    });
                } else {
                    next(data, undefined);
                }
            })
            .fail(function (err) {
                sails.log(err);
            })
    },
    search : function (q, criteria, next){
        this.find(criteria)
            .where({or: [{title:{'like':q+'%'}}, {title:{'like':Translit.transliterate(q)+'%'}}]})// @todo translit search slow, should fix
            .then(function(tasks){
                var result =[];
                _(tasks).forEach(function (task) {
                    result.push({type: "task", id:task.id, identity: task.title, status: task.status});
                });
                next(result);
            })
            .fail(function(err){
                console.log(err, 'Err in search Task.js');
            });
    },
    // broadCast task to group, project, assigned and created users via sockets
    broadCast : function (obj, data, user) {
        obj = this.unPopulate(obj);
        // send msg about update to all users in Group and Project except user who done update
        if (!!obj.grp) {
            sails.sockets.broadcast("groupID#" + obj.grp,'task', data);
        }
        if (!!obj.project) {
            sails.sockets.broadcast("projectID#"+ obj.project,'task', data);
        }
        // Inform users who created and assigned to tasks except user who uploading
        if (!!obj.assignedTo && obj.assignedTo !== user.id) {
            sails.sockets.broadcast("userID#" + obj.assignedTo, 'task', data);
        }
        if (obj.createdBy !== user.id) {
            sails.sockets.broadcast("userID#" + obj.createdBy, 'task', data);
        }

    },
    // Clean object from populated associations
    unPopulate : function (obj) {
        // return create shallow copy of unpopulated obj
        var cleanObj = {};
        _(obj).forEach(function (v, k) {
            // if we got array then delete collections or we got prop that does not exists
            if (Task.attributes.hasOwnProperty(k) && !_.isArray(obj[k])) {
                if (!_.isEmpty(v) && v.hasOwnProperty('id')) {
                    // _.isEmpty for Numbers returns true, they have no length.
                    cleanObj[k] = v.id;
                } else {
                    cleanObj[k] = v;
                }
            }
        });
        return cleanObj;
    },
    children: function (id, cb) {
        Task.findOne({id: id})
            .populate('children')
            .then(function (task) {
                if (_.isEmpty(task.children)) {
                    cb();
                }
                cb(task.children);
            });
    },
    // check if task can be completed
    isSubTasksCompleted: function (id, cb) {
        this.children(id, function (subTasks) {
            if (subTasks) {
                if (_.every(subTasks, {status: 'complete'})) {
                    cb(true);
                } else {
                    cb(false);
                }
            } else {
                cb();
            }
        })
    }

};


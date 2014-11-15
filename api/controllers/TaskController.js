/**
 * TaskController
 *
 * @description :: Server-side logic for managing Tasks
 * @help        :: See http://links.sailsjs.org/docs/controllers
 * @author      :: Mirolim Mirzakhmedov mirolim777 at gmail dot com
 * @date        :: 10.06.14
 */
"use strict";
module.exports = {

    create : function (req, res) {
        var newTask = req.body;
        // task title should not be empty
        if (_.isEmpty(newTask.title)) {
            return res.json({msgType: "warning", code: 400, msg: "Task title empty"}, 400);
        }
        // fix problem with sails crash (waterline) when model send with extra fields
        // clean obj before so sails will not crash, should be cleaned in TaskController actions update and create
        newTask = Task.unPopulate(newTask);
        newTask.createdBy = req.session.user.id;
        async.auto({
                user : function (cb) {
                    if (newTask.hasOwnProperty('assignedTo') && !isNaN(parseInt(newTask.assignedTo))) {
                        User.findOne({id: newTask.assignedTo}).exec(cb);
                    } else {
                        cb();
                    }
                }
            }, function done(err, result) {
                if (err) {
                    return res.json(err);
                }
                if (typeof result.user !== 'undefined') {
                    newTask.grp = result.user.grp;
                }
                Task.create(newTask).exec( function (err, task) {
                    if (err) {
                        sails.log.error(err, 'Error in TaskCtrl.create');
                        return res.json(err);
                    }
                    if (task) {
                        Task.findOne({id: task.id})
                            .populate('grp')
                            .populate('project')
                            .populate('createdBy')
                            .populate('assignedTo')
                            .then(function (task) {
                                var data = {};
                                data.id = task.id;
                                data.data = task;
                                data.verb = 'created';

                                if ( req.isSocket === true ) {
                                    Task.broadCast(task, data, req.session.user);
                                }
                                res.json(data);

                            })
                            .fail(function (err) {
                                sails.log(err, 'Err in populate task in TaskCtrl.create');
                                return res.json(err);
                            })

                    }
                });
        });
    },
    update : function (req, res) { 
        var task = req.body;
        // task title must not be empty
        if (_.isEmpty(task.title)) {
            return res.json({msgType: "warning", code: 400, msg: "Task title empty"}, 400);
        }
        // fix problem with sails crash (waterline) when model send with extra fields
        // clean obj before so sails will not crash, should be cleaned in TaskController actions update and create
        task = Task.unPopulate(task);
        // add user who is updating task
        task.updatedBy = req.session.user.id;

        // check if task is assigned and if assigned then set assigned user's groups as task group
        async.auto({
            oldTask: function (cb) {
                Task.findOne({id: task.id}).exec(cb);
            },
            user : function (cb) {
                User.findOne({id: task.assignedTo}).exec(cb);
            }
        }, function done(err, result) {
            // set of checks
            if (err) {
                return res.json(err);
            }
            // check if task exists
            if (typeof result.oldTask === 'undefined') {
                return res.json({msgType: "warning", code: 404, msg: "Task not found"}, 404);
            }
            if (typeof result.user !== 'undefined') {
                task.grp = result.user.grp;
            }
            // log Task history
            var log = {
                task: task.id,
                user: task.updatedBy
            };
            // compare all properties and log changes
            _(task).forEach(function (v, k) {
                // values should not be functions or arrays
                if (!(_.isArray(v) || _.isFunction(v))) {
                    // don't check created or udpated dates
                    if (!(k == 'createdAt' || k == 'updatedAt') && (result.oldTask[k] !== task[k])) {
                        log.action = k;
                        if (k == 'status') {
                            // save new status
                            log.data = task.status;
                        } else {
                            log.data = v.toString();
                        }
                        TaskLog.create(log).exec(function (err, log) {
                            if (err) {
                                sails.log(err, 'Error on log create');
                            }
                        });
                    }
                }
            });
            Task.update(task.id, task)
                .then(function(newTasks) {
                    // task now is array of tasks
                    // get first
                    Task.findOne({id: _.first(newTasks).id})
                        .populate('grp')
                        .populate('project')
                        .populate('createdBy')
                        .populate('comments')
                        .populate('assignedTo')
                        .populate('children')
                        .then(function(newTask) {
                            // check if task exists
                            if (typeof newTask === 'undefined') {
                                return res.json({msgType: "warning", code: 404, msg: "Task not found"}, 404);
                            }
                            // @todo refactor temp fix for angular
                            // prepare obj to be consumable by angular
                            var data = {};
                            data.id = newTask.id;
                            data.data = newTask;
                            data.verb = 'updated';
                            if ( req.isSocket === true ) {
                                Task.broadCast(newTask, data, req.session.user);
                            }
                            res.json(data);
                            // check if parent task should be completed if task has parent and is complete
                            if (!_.isNull(newTask.parent) && newTask.status === 'complete' && (result.oldTask.status !== newTask.status)) {
                                // check if all subtasks of task parent completed
                                Task.isSubTasksCompleted(newTask.parent, function (bool) {
                                    if (bool === true) {
                                        Task.update(newTask.parent, {status: 'complete'})
                                            .then(function(newTasks) {
                                                // task now is array of tasks
                                                // get first
                                                Task.findOne({id: _.first(newTasks).id})
                                                    .populate('grp')
                                                    .populate('project')
                                                    .populate('createdBy')
                                                    .populate('assignedTo')
                                                    .populate('children')
                                                    .then(function (parent) {
                                                        // prepare obj to be consumable by angular
                                                        var data = {};
                                                        data.id = parent.id;
                                                        data.data = parent;
                                                        data.verb = 'updated';
                                                        Task.broadCast(parent, data, req.session.user);
                                                    })
                                                    .fail(function (err) {
                                                        sails.log.error(err, 'TaskCtrl.update isSubTasksCompleted');
                                                        res.json(err);
                                                    });
                                            })
                                            .fail(function (err) {
                                                res.json(err);
                                            })
                                    }
                                });
                            }
                        })
                        .fail(function(err) {
                            sails.log(err, 'TaskCtrl.update');
                            return res.json(err);
                        });
                })
                .fail(function (err) {
                    sails.log.error(err, 'TaskCtrl.update');
                    return res.json(err);
                });
        });
        // auto.async end

    },
    destroy : function (req, res) {
        // get id of task to delete
        // should be Int
        var id = parseInt(req.param('id'));
        // check if number
        if (isNaN(id)) {
            return res.json({msgType: "warning", code: 404, msg: "Task id missing"}, 404);
        }
        // get task to delete
        Task.findOne({id: id})
            .then(function (task) {
                // check if task exists
                if (typeof task === 'undefined') {
                    return res.json({msgType: "warning", code: 404, msg: "Task not found"}, 404);
                }
                // @todo support passing criteria to Destroy beacause it is accepting Criteria, it can delete a batch of tasks
                Task.destroy({id: id}).exec(function (err) {
                    if (!err) {
                        // destroy TaskLog for deleted task
                        TaskLog.destroy({task: id}).exec(function (err) {
                            if (err) {
                                sails.log.error(err, 'Err in Task destroy action in tasklog.destroy');
                            }
                        });
                        // @todo refactor temp fix for angular
                        // prepare obj to be consumable by angular
                        var data = {};
                        data.id = task.id;
                        data.data = task;
                        data.verb = 'destroyed';
                        if ( req.isSocket === true ) {
                            Task.broadCast(task, data, req.session.user);
                        }
                        return res.json({msgType: "success", code:200, msg: "Task with id "+ id + " deleted."}, 200);
                    } else {
                        sails.log.error(err, 'Err on Task destroy');
                        res.json(err);
                    }
                });
            })
            .fail(function (err) {
                sails.log.error(err, 'Err TaskCtrl.destroy');
                return res.json(err);
            })

    },
    // returns array of all related task for particular task
    // mainly required to draw related tasks tree
    // @todo rename maybe?
    tree : function (req, res) {
        var taskId = parseInt(req.param('id'));
        // check if number
        if (isNaN(taskId)) {
            return res.json({msgType: "warning", code: 404, msg: "Task id missing"}, 404);
        }
        Task.getTaskTree(taskId, function(tasks, err) {
            if(!!err) {
                res.json({msg:"Error: "+err});
            }
            res.json(tasks);
        });
    },
    // get tasklog
    history : function (req, res) {
        var id = req.param('id');
        // check if number
        if (isNaN(id)) {
            return res.json({msgType: "warning", code: 404, msg: "Task id missing"}, 404);
        }
        // find all task history
        TaskLog.find({task: id})
            .populate('user')
            .exec(function (err, taskLogs) {
            if (!err) {
                res.json(taskLogs);
            } else {
                console.log(err, 'Error in tasklog action in task controller');
                res.json(err);
            }
        })
    },
    // File upload for tasks
    upload: function (req, res) {
        // task id
        var taskId = req.param('id');
        // check if number
        if (isNaN(taskId)) {
            return res.json({msgType: "warning", code: 404, msg: "Task id missing"}, 404);
        }
        // get file and check if exists
        Task.findOne({id: taskId})
            .then(function (task) {
                // check if task exists
                if (typeof task === 'undefined') {
                    return res.json({msgType: "warning", code: 404, msg: "Task not found"}, 404);
                }
                // get filename replaces all spaces with underscore and add timestamp at the end of file
                var filename = req.file('file')._files[0].stream.filename.replace(/ /g, '_') + '__' + Date.now().toString();
                // filepath
                var filepath = './.tmp/uploads/' + filename;
                // write file to disk
                req.file('file').upload(filepath, function (err, files) {
                    if (!err) {
                        // prepare file model
                        // @todo support batch file uploads
                        var file = {
                            task: taskId,
                            name: files[0].filename,
                            path: filepath, // path where file uploaded
                            mime: files[0].type,
                            size: files[0].size,
                            uploadedBy: req.session.user.id
                        };
                        // save file model
                        File.create(file).exec(function (err, file) {
                            if (err) {
                                console.log(err, 'Err in File.create in TaskCtrl.upload');
                            }
                        });
                        // @todo refactor temp fix for angular
                        // prepare obj to be consumable by angular
                        var data = {};
                        data.id = tas.id;
                        data.data = file.name;
                        data.verb = 'fileAdded';
                        // Broadcast to group and project users
                        if ( req.isSocket === true ) {
                            Task.broadCast(task, data, req.session.user);
                        }
                        res.json({
                            message: files.length + ' file(s) uploaded successfully!',
                            files: files
                        });

                    } else {
                        sails.log(err, 'Task file upload');
                        return res.serverError(err);
                    }

                });
            })
            .fail(function (err) {
                return res.json(err);
            });

    },
    getFiles: function (req, res) {
        // task id
        var taskId = req.param('id');
        // check if number
        if (isNaN(taskId)) {
            return res.json({msgType: "warning", code: 404, msg: "Task id missing"}, 404);
        }
        // // query parser
        File.find({task: taskId})
            .populate('uploadedBy')
            .then(function (files) {
                // remove path property for security reasons
                files.forEach(function (o) { return delete o.path; });
                res.json(files);
            })
            .fail(function (err) {
                res.json(err);
            });
    }

};

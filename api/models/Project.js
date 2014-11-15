/**
 * Author: Mirolim Mirzakhmedov
 * Date: 12.07.14
 * Time: 16:38
 * @description Project model
 */
"use strict";
module.exports = {

  attributes: {
      title: {
          type: 'string',
          required: true,
          unique: true
      },      
      createdAt: {
          type: 'datetime',
          columnName: 'created_at'
      },
      updatedAt: {
          type: 'datetime',
          columnName: 'updated_at'
      },
      // collection of users in group
      description: {
          type: 'text',   
          required: true
      },
      tasks: {
          collection: 'Task',
          via: 'project'
      },
      createdBy : {
          type: 'integer',
          columnName: 'created_by'
      }
  },
  getTasks : function (projectId, criteria, next) {
      var start = process.hrtime();
      // complete tasks not longer than 2 weeks ago
      var week = 1000*60*60*24*7;
      var twoWeeksAgo = Date.now() - 2*week;
      twoWeeksAgo = new Date(twoWeeksAgo);
      twoWeeksAgo = twoWeeksAgo.toISOString();
      // @todo use criteria (currently not used)
      // by default sort by priority and date and limit finished tasks by two weeks
      this.findOne(projectId)
          .then(function(project) {
              // check if project exists
              if (typeof project === 'undefined') {
                  return res.json({msgType: "warning", code: 404, msg: "Project not found"}, 404);
              }
              // @todo maybe use digits instead of words, it will be more flexible
              // populate task with status 'inbox', 'active' and 'assign'
              Task.find({sort: 'priority DESC and updatedAt ASC', where: {project: projectId, status:['inbox','active']}})
                  .then(function (tasks) {
                      // find completed tasks created by group members in last 2 weeks
                      var tasksFinished = Task.find({sort: 'updatedAt ASC', where: {project: projectId, status: 'complete', updatedAt: {'>': twoWeeksAgo}}})
                          .then(function (tasksFinished) {
                              return tasksFinished;
                          });
                      // return promise results
                      return [tasks, tasksFinished];
                  })
                  .spread(function (tasks, tasksFinished) {
                      // get all tasks ids
                      var taskIds = _.map(tasks.concat(tasksFinished), 'id');
                      Task.find({id: taskIds})
                          .populate('grp')
                          .populate('project')
                          .populate('createdBy')
                          .populate('comments')
                          .populate('assignedTo')
                          .populate('children') // @todo find why children should be last (otherwise empty)
                          .then(function (allTasks) {
                              // join all results
                              var projectTasks = {
                                  id: project.id,
                                  createdAt: project.createdAt,
                                  updatedAt: project.updatedAt,
                                  title: project.title,
                                  description: project.description,
                                  tasks: allTasks,
                                  t: process.hrtime(start) // performance
                              };
                              next(projectTasks, undefined);
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
  getUsers: function (projectId, criteria, next) {
        // Find all users in project
        UserProject.find()              
                .where({project: projectId})
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
              .where({title:{'like':q+'%'}}, {title:{'like':Translit.transliterate(q)+'%'}})
              .then(function(projects){
                  var result=[];
                  for(var project in projects){
                      result.push({type:"project", id:projects[project].id, identity: projects[project].title, data: projects[project]});
                  }
                  next(result);
              })
              .fail(function(err){
              console.log(err, 'Err in search Project.js');
              });
    }
    
};


/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/
"use strict";
module.exports = {

  attributes: {
      identity: {
          type: 'string',
          required: true,
          minLength: 2,
          unique: true
      },
      publicId : {
          type: 'integer',
          columnName: 'public_id',
          required: true
      },
      fullName: {
          type: 'string',
          required: true,
          columnName: 'full_name',
          index: true
      },
      email: {
          type: 'email', // Email type will get validated by the ORM
          required: true,
          unique: true
      },
      role: {
          type: 'string',
          defaultsTo: 'guest',
          enum: ['user', 'manager', 'top', 'admin'],
          index: true
      },
      info: {
          type: 'text'
      },
      createdAt: {
          type: 'datetime',
          columnName: 'created_at' // use in db "_" to increase compatibility
      },
      updatedAt: {
          type: 'datetime',
          columnName: 'updated_at'
      },
      // which group user belongs to (don't use group name)
      grp: {
          model: 'Grp',
          columnName: 'grp_id',
          index: true
      },
      slaveOf: {
          model: 'User',
          columnName: 'slave_of',
          index:true
      },
      slaves: {
          collection: 'User',
          via: 'slaveOf'
      },
      // all tasks which are assigned to user
      assignedTasks: {
          collection: 'Task',
          via: 'assignedTo'
      },
      skype: {
          type: 'string'
      },
      isOnline: {
        type: 'boolean',
        columnName: 'is_online'
      },
      // all tasks which were created by user
      createdTasks: {
          collection: 'Task',
          via: 'createdBy'
      }, 
      code: {
          type: 'string'
      }

    },
    isExists : function (publicId, next){
      // @todo refactor
      User.findOne({publicId: publicId})
        .then(function (user){
          if (typeof user !== 'undefined') {
              // save in session accessible projects and isManager boolean status
              // by saving in session we decrease db requests
              UserProject.find({user: user.id})
                  .then(function(projects) {
                      if(!_.isEmpty(projects)) {
                          user.projects = _.map(projects, function (o) { return { id: o.project, isManager: !!o.isManager }});
                      }
                      // save in session child groups if user is manager
                      if ( user.role !== 'user') {
                          Grp.find({parent: user.grp})
                              .then(function (groups) {
                                  user.groups = groups;
                                  next(user);
                              })

                      } else {
                          next(user);
                      }

                  })
                  .fail(function(err){
                      sails.log(err);
                  });
          } else {
            next(false);
          }
        })
        .fail(function (err) {
          next(false);
        });
    },

    authorize : function (userFields, next) {
      User.isExists(parseInt(userFields.public_id), function (user) {
        if (user === false) {
          var newUser = {
            identity : userFields.nickname,
            email: userFields.email,
            fullName: userFields.fullname,
            publicId: userFields.public_id,
            role : "user"
          };

          User.create(newUser)  
            .then(function(user) {
                //Auth then success created
                  next(user, undefined);
            })
            .fail(function (err) {
                next(undefined, err);
          });

        } else {
            //Auth then success created
            next(user, undefined);
        }
      });
    },

  search : function (q, criteria, next){

      this.find(criteria)
              .where({or: [{identity:{'like':q+'%'}}, {full_name:{'like':q+'%'}}, {full_name:{'like':Translit.transliterate(q)+'%'}}, {identity:{'like':Translit.transliterate(q)+'%'}}]})
              .then(function(users){
                  var result =[];
                  for(var user in users){
                      result.push({type:"user", id:users[user].id, identity: users[user].fullName, data: users[user]});
                  }
                  next(result);
              })
              .fail(function(err){
                console.log(err, 'Err in search User.js');
              });
  },
  // get all user's projects
  getProjects: function (id, cb) {
      UserProject.find({user: id})
          .then(function (results) {
              if (_.isEmpty(results)) {
                  return cb({msgType: "warning", code: 404, msg: "No Projects found"});
              }
              // get all users ids
              var projectIds = _.map(results, 'project');
              Project.find({id: projectIds})
                  .then(function (projects) {
                      if (_.isEmpty(projects)) {
                          return cb({msgType: "warning", code: 404, msg: "No Projects found"});
                      }
                      cb(undefined, projects);
                  })
                  .fail(function (err) {
                      cb(err);
                  })

          })
          .fail(function (err) {
              cb(err);
          });
  },
    // get user's group and child groups
    // get all user's projects
    getGroups: function (id, cb) {
        User.findOne({id: id})
            .then(function (user) {
                if (_.isEmpty(user)) {
                    return cb({msgType: "warning", code: 404, msg: "No user found"});
                }
                Grp.findOne({id: user.grp})
                    .populate('children')
                    .then(function (group) {
                        if (typeof group === 'undefined') {
                            return cb({msgType: "warning", code: 404, msg: "No group found"});
                        }
                        // find child groups
                        cb(undefined, group);
                    })
                    .fail(function (err) {
                        sails.log.error(err, 'User.getGroups');
                        cb(err);
                    })

            })
            .fail(function (err) {
                sails.log.error(err, 'User.getGroups');
                cb(err);
            });
    }

};


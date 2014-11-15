/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!documentation/
 */


module.exports.policies = {

  // Default policy for all controllers and actions
  // (`true` allows public access)
  '*': true,
    AuthController: {
        '*' : true,
        'logout': 'isLoggedIn'
    },
    UserController: {
        '*' : 'isLoggedIn',
        'tasks': 'isLoggedIn'
    },
    GrpController: {
        // deny access if user does not belong to group
        '*' : 'isLoggedIn',
        'delete' : ['isLoggedIn', 'isAdmin'],
        'update' : ['isLoggedIn', 'isGroupManager']
        
    },
    ProjectController: {
        // deny access if user does not belong to project
        '*' : 'isLoggedIn',
        'delete' : ['isLoggedIn', 'isAdmin'],
        'update' : ['isLoggedIn', 'isProjectManager']
    },
    TaskController : {
        'update' : ['isLoggedIn', 'canAssignTask'],
        'destroy' : ['isLoggedIn', 'canDeleteTask']
    },
    CommentController : {
        '*' : 'isLoggedIn'
    },
    FileController : {
        '*' : 'isLoggedIn'
    }

};

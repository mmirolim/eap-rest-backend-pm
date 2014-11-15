/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `config/404.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on routes, check out:
 * http://links.sailsjs.org/docs/config/routes
 */

module.exports.routes = {

    // @TODO group routes by controllers
    // Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, etc. depending on your
    // default view engine) your home page.
    //
    // (Alternatively, remove this and add an `index.html` file in your `assets` directory)
    '/': 'UserController.profile',
    'get /signup' : { view: 'auth/signup' },
    'post /signup' : 'AuthController.signup',
    'get /login' : { view: 'auth/loginopenid' },
    'get /openid-in' : { view: 'auth/openid-in'},
    'post /login' : 'AuthController.loginopenid',
    '/logout' : 'AuthController.logout',
    'get /me' : 'UserController.profile',
    'get /authenticate': 'AuthController.loginopenid',
    'get /verify': 'AuthController.loginopenid',
    'post /api/v1/tasks' : 'TaskController.create',
    'get /api/v1/users/:id/tasks' : 'UserController.tasks',
    'get /api/v1/users/:id/projects' : 'UserController.projects',
    'get /api/v1/users/:id/groups' : 'UserController.groups',
    'get /api/v1/projects/:id/tasks' : 'ProjectController.tasks',
    'get /api/v1/groups/:id/tasks' : 'GrpController.tasks',
    'get /api/v1/groups/:id/dependent' : 'GrpController.dependent',
    'get /api/v1/projects/:id/users' : 'ProjectController.users',
    'get /api/v1/projects/:id/dependent' : 'ProjectController.dependent',
    'get /api/v1/groups/:id/users' : 'GrpController.users',
    'get /api/v1/search/assign/:q' : 'SearchController.assign',
    'get /api/v1/search/:q' : 'SearchController.search',
    'get /api/v1/groups' : 'GrpController.find',
    'get /api/v1/tasks/:id/tree' : 'TaskController.tree',
    'get /api/v1/tasks/:id/history' : 'TaskController.history',
    'post /api/v1/tasks/:id/files' : 'TaskController.upload',
    'get /api/v1/tasks/:id/files' : 'TaskController.getFiles',
    'get /api/v1/files/:id' : 'FileController.getFile',
    'post /api/v1/comments' : 'CommentController.create'

};

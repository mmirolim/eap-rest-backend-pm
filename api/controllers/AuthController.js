/**
 * AuthController
 *
 * @description :: Server-side logic for managing Auths via OPENID.
 * @author      :: Ramil
 * @date        :: 2014/06/24
 */
"use strict";
var openid = require('openid');
var url = require('url');
var querystring = require('querystring');

module.exports = {
	


  /**
   * `AuthController.signup()`
   */
  signup: function (req, res) {
    if (req.method === 'POST') {
        var values = req.allParams();
        // all required params should not be empty
        for (var key in values) {
            if (values.hasOwnProperty(key)) {
                if (values[key] == '') {
                    return res.json({error: 'Field ' + key + ' should not be empty'}, 400);
                }
            }
        }
        // confirm password
        if (values.password !== values.passwordConfirm) {
            return res.json({error: 'Password and password confirm fields did not match'}, 400);
        }
        // login must be unique
        User.findOneByLogin(values.login).exec(function (err, user) {
            if (err) {
                res.json({error: 'DB error'}, 500);
            }
            if (user) {
                res.json({error: 'Login is already taken'}, 400);
            }
        });
        // email must be unique
        User.findOneByEmail(values.email).exec(function (err, user) {
            if (err) {
                res.json({error: 'DB error'}, 500);
            }
            if (user) {
                res.json({error: 'Email must be unique'}, 400);
            }
        });
        // create a new user with params from values
        User.create(values).exec(function createCB(err, newUser) {
            if (err) {
                res.json({error: 'DB error', message: err}, 400);
            }
            if (newUser) {
                res.json({success: 'New user with ' + newUser.login + ' login created'}, 201);
            }
        });
    }
  },

  loginopenid : function(req, res) {
    var extensions = [new openid.SimpleRegistration(
                      {
                        "nickname" : true,
                        "email" : true,
                        "fullname" : true,
                        "public_id" : true
                        //"dob" : true,
                        //"gender" : true,
                        //"postcode" : true,
                        //"country" : true,
                        //"language" : true,
                        //"timezone" : true
                      })
                      /*new openid.AttributeExchange({
                        "public_id" : true
                      }),*/
                    ];
    var relyingParty = new openid.RelyingParty(
        sails.config.testUrl+'/verify?simple=1',// Verification URL (yours)
        null, // Realm (optional, specifies realm for OpenID authentication)
        false, // Use stateless verification
        false, // Strict mode
        extensions); // Optional list of extensions to enable and include
        
    var parsedUrl = url.parse(req.url);
    if (parsedUrl.pathname == '/authenticate') {
      // User supplied identifier
      var query = querystring.parse(parsedUrl.query);
      var identifier = query.openid_identifier;
      identifier += ".id.uz";

      // Resolve identifier, associate, and build authentication URL
      relyingParty.authenticate(identifier, false, function(error, authUrl) {
        if (error) {
          res.writeHead(200, { 'Content-Type' : 'text/plain; charset=utf-8' });
          res.end('Authentication failed: ' + error.message);
        } else if (!authUrl) {
          res.writeHead(200, { 'Content-Type' : 'text/plain; charset=utf-8' });
          res.end('Authentication failed');
        } else {
          res.writeHead(302, { Location: authUrl });
          res.end();
        }
      });
    } else if (parsedUrl.pathname === '/verify') {
      // Verify identity assertion
      // NOTE: Passing just the URL is also possible
      relyingParty.verifyAssertion(req, function(error, result) {
        if (error) {
          req.session.user = null;
          req.session.authenticated = false;
          res.end('Authentication failed: ' + error.message);
          res.redirect('/login');

        } else {
          //OpenID verify success
          //Create user if not exists and authorize it          
          User.authorize(result, function(user, err) {
            if (err !== undefined) {
                return res.end('Error1' + err);
            }
            req.session.user = user;
            req.session.authenticated = true;
            // redirect to entry point
            res.redirect('/openid-in');

          });
        }
      });
    }

  },


  /**
   * `AuthController.logout()`
   */
  logout: function (req, res) {
      req.session.user = null;
      req.session.authenticated = false;
      res.redirect('/login');
  }
};


/**
 *ProjectController
 *
 * @description :: Server-side logic for managing Projects
 * @author      :: Ramil
 * @date        :: 2014/06/24
 */
"use strict";
module.exports = {
    // search for assignig to users, group and projects
    assign: function (req, res) {
        var q = req.param('q');
        // check if empty
        if (_.isEmpty(q)) {
            return res.json({msgType: "warning", code: 404, msg: "Search word missing"}, 404);
        }
        var data = [];
        var results = [];
        
        var allParams = req.allParams();        
        var criteria = ParserService.parseGetParams(allParams);

        Project.search(q, criteria, function(result){
            data.push(result);
            Grp.search(q, criteria, function(result){
                data.push(result);
                // if not manager you don't need users
                if (req.session.user.role === 'user') {
                    for(var arr in data){
                        for(var rec in data[arr]){
                            results.push(data[arr][rec]);
                        }
                    }

                    results.sort(function(a,b){
                        if (a.identity < b.identity)
                            return -1;
                        if (a.identity > b.identity)
                            return 1;
                        return 0;
                    });
                    res.json(results);
                } else {
                    // if manager search for users
                    User.search(q, criteria, function(result){
                        data.push(result);
                        for(var arr in data){
                            for(var rec in data[arr]){
                              results.push(data[arr][rec]);
                            }
                        }

                        results.sort(function(a,b){
                           if (a.identity < b.identity)
                             return -1;
                           if (a.identity > b.identity)
                              return 1;
                            return 0;
                          });
                        res.json(results);
                    });
                }
            });
        });
    },
    // main search like assing but also for task and without translit
    search: function (req, res) {
        var q = req.param('q');
        // check if empty
        if (_.isEmpty(q)) {
            return res.json({msgType: "warning", code: 404, msg: "Search word missing"}, 404);
        }
        var data = [];
        var results = [];

        var allParams = req.allParams();
        var criteria = ParserService.parseGetParams(allParams);

        Project.search(q, criteria, function(result){
            data.push(result);
            Grp.search(q, criteria, function(result){
                data.push(result);
                User.search(q, criteria, function(result){
                    data.push(result);
                    Task.search(q, criteria, function (result) {
                        data.push(result);
                        for(var arr in data){
                            for(var rec in data[arr]){
                                results.push(data[arr][rec]);
                            }
                        }
                        results.sort(function(a,b){
                            if (a.identity < b.identity)
                                return -1;
                            if (a.identity > b.identity)
                                return 1;
                            return 0;
                        });
                        res.json(results);
                    });
                });
            });
        });
    }
}


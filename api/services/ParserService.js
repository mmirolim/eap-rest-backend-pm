/**
 * Created by PhpStorm.
 * Author: Mirolim Mirzakhmedov
 * Date: 18.06.14
 * Time: 16:38
 * Parser Service parsing GET url params to construct 'criteria' to use in db searches
 */
"use strict";
module.exports = {
    parseGetParams : function (params) {        
        var query = {
            limit: 100,
            skip: 0,
            sort: 'id DESC',
            where: []
        };
        for (var key in query) {
            if (params.hasOwnProperty(key)) {
                if (params[key] !== '') {
                    if (key === 'where') {
                        // where params
                        var filter = JSON.parse(params[key]);
                        var where = {}
                        if (filter.length > 1) {
                            where.or = filter;
                        } else {
                            where = filter;
                        }
                        query[key] = where;
                    } else {
                        // basic sort, limit, offset params
                        query[key] = params[key];
                    }
                }
            }
        }
        if(query.where.length === 0){
            delete query.where;
        }
        return query
    }
}

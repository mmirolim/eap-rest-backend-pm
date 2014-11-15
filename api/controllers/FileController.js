/**
 * @description :: Server-side logic for managing Projects
 * Created by PhpStorm.
 * Author: Mirolim Mirzakhmedov
 * Date: 17.07.14
 * Time: 12:56
 */
"use strict";
var fs = require('fs');  // file system
module.exports = {
    getFile: function (req, res) {
        // file model id
        // id should be integer
        var id = parseInt(req.param('id'));
        // check if number
        if (isNaN(id)) {
            return res.json({msgType: "warning", code: 404, msg: "File id missing"}, 404);
        }
        File.findOne({id: id})
            .then(function (file) {
                // handle error when file not found
                // check if file exists
                if (typeof file === 'undefined') {
                    return res.json({msgType: "warning", code: 404, msg: "Group not found"}, 404);
                }
                try {
                    // create read stream
                    var rs = fs.createReadStream(file.path);
                    // set proper headers and encode file.name (maybe non english names used)
                    res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(file.name));
                    res.setHeader('Content-Type', file.mime);
                    res.setHeader('Content-Length', file.size);
                    // and pipe it to user
                    rs.pipe(res);
                } catch (e) {
                    sails.log.warn(e, 'FileCtrl.getFile');
                    res.json(e)
                }

            })
            .fail(function (err) {
                res.json(err);
            })
    }
};

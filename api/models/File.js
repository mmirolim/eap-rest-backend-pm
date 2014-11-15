/**
 * File.js
 * Author: Ramil
 * Date: 05.08.14
 * Time: 16:38
 * @description :: File model for attached to task files.
 */
"use strict";
module.exports = {

    attributes: {
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
        task: {
            model: 'Task',
            columnName: 'task_id',
            index: true,
            required: true
        },
        name: {
          type: 'string',
          columnName: 'filename',
          required: true
        },
        // path where file uploaded
        // @todo what will happen if path is bigger then varchar 255 'string'?
        path: {
          type: 'string',
          required: true
        },
        // @todo remember Waterline have many protected Words, do not use them
        mime: {
          type: 'string',
          required: true,
          columnName: 'mime_type'
        },
        size: {
          type: 'integer',
          required: true
        },
        uploadedBy: {
          model: 'User',
          columnName: 'uploaded_by'
        },
        description: {
          type: 'text'
        }
    },
    // after saving file
    // add to TaskLog
    afterCreate: function (file, next) {
        // log Task creation
        var log = {
            task: file.task,
            user: file.uploadedBy,
            action: 'fileAdded',
            data: file.name
        };
        TaskLog.create(log).exec(function (err, log) {
            if (err) {
                console.log(err, 'Err in afterCreate File');
            }
        });
        // forward File
        next();
    }

};

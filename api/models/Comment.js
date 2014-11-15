/**
 * Comment.js
 * Author: Ramil
 * Date: 05.08.14
 * Time: 16:38
 * @description :: Comment model to related Tasks.
 */
"use strict";
module.exports = {

    attributes: {
        createdAt: {
            type: 'datetime',
            columnName: 'created_at'
        },
        updatedAt: {
            type: 'datetime',
            columnName: 'updated_at'
        },
        text: {
            type: 'text',
            required: true
        },
        createdBy: {
          model: 'User',
          columnName: 'created_by',
          index: true
        },
        task: {
          model: 'Task',
          columnName: 'task_id',
          index: true,
          required: true
        }
    },
    // Log to TaskLog when comment added
    afterCreate: function (comment, next) {
        // log Task creation
        var log = {
            task: comment.task,
            user: comment.createdBy,
            action: 'commentAdded',
            data: comment.id
        };
        TaskLog.create(log).exec(function (err, log) {
            if (err) {
                console.log(err, 'Err in afterCreate Comment');
            }
        });
        // forward comment
        next();
    },

};

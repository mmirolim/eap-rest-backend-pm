/**
 * Created by PhpStorm.
 * Author: Mirolim Mirzakhmedov
 * Date: 12.07.14
 * Time: 16:38
 * Task history model to keep record of particular task changes
 */
"use strict";
module.exports = {
    

    attributes : {
        task : {
            model : 'Task',
            columnName : 'task_id',
            required : true,
            index : true
        },
        user : {
            model : 'User',
            columnName : 'user_id',
            index : true
        },
        action : {
            type : 'string',
            index : true
        },
        data : {
            type : 'string' // @todo check if it enough to set description or just ignore
            }
        
    },
}


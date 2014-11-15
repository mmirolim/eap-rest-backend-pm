/**
 * Created by PhpStorm.
 * Author: Mirolim Mirzakhmedov
 * Date: 20.07.14
 * Time: 16:38
 * Simple redis cache service
 */
"use strict";
var redis = require("redis"),
client = redis.createClient();
client.on("error", function (err) {
    console.log("Error IN Redis service" + err);
});
module.exports = {
    // set hash data type
    hset: function (key, field, value) {
        return client.hset(key, field, value, function (err, res) {
                    if (!err) {
                        return true;
                    } else {
                        sails.log(err, 'Err in Redis.hset');
                        return false;
                    }
                });
    },
    // get hash data
    hget: function (key, field, next) {
        return client.hget(key, field, function (err, reply) {
                if (!err) {
                    return next(undefined, reply);
                } else {
                    return next('Err in Redis.hget', reply);
                }
            });
    }

}

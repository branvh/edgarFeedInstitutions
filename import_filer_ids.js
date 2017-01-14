const request = require("request");
const mysql = require("mysql");
const fs = require("fs");
const appKey = 'q9kxwxqjayeqmqwg3ffphupa';
const writeFile = '13fList.csv';
const totalFields = 4230; //# records as of jan 13, 2017
const limit = 999;
let apiRuns = Math.ceil(totalFields / limit);
let offset = 0;

//================================DB INFO===================================================================
const DB = 'fund_holdings';
const TABLE = 'filer_ids';
const PASS = 'MGoblue3!';

let sqlDetails = {

    host: 'localhost',
    port: 3306,
    user: 'root',
    password: PASS,
    database: DB

};
//================================FUNCTIONS========================================================================


//create an array of API request strings to obtain 13F filers from the SEC
const makeApiArray = () => {

    let queryStrings = [];
    let url = '';

    for (let i = 0; i < apiRuns; i++) {

        offset = limit * i;

        url = 'http://edgaronline.api.mashery.com/v2/descriptions/ownership-currentissueholders/filerid?limit=' + limit + '&offset=' + offset + '&sortDirection=asc&appkey=' + appKey;

        queryStrings.push(url);

    }

    return queryStrings;

}

//upon resolution of the promise - e.g. the api responses with data - the iterator above will move on to the next request 
//and capture data
const dataRequest = (query) => {

    return new Promise((resolve, reject) => {

        request(query, (error, response, body) => {

            if (error) {
                reject(error);
            } else {
                resolve(body);
            }

        })

    })

}

//console.log(queryArray);

//input an array, iterate api requests for each...avoids hitting API limits for consecutive data requests....have to do multiple
//due to only being allowed 999 items in a given api response
function* requestGenerator() {

    let data = [];
    for (let i = 0; i < apiRuns; i++) {

        data = yield dataRequest(queryArray[i]);
        if (data !== undefined) {
            console.log('received data for yield ' + i);
            data = JSON.parse(data);
            data = data.descriptions;
            data = data.join('),(');
            data = '(' + data + ');';
            console.log(typeof(data));
            console.log('insert into filer_ids (filer) values ' + data);

            //BULK UPLOAD........................

            con.query('insert into filer_ids (filer) values ' + data, function(err, res) {
                if (err) {
                    throw err;
                } else {
                    console.log("Your input was successful!");
                }
                con.end();
            });

        }
    }

}

function runGenerator(g) {
    var it = g(),
        ret;

    // asynchronously iterate over generator
    (function iterate(val) {
        ret = it.next(val);

        if (!ret.done) {
            // poor man's "is it a promise?" test
            if ("then" in ret.value) {
                // wait on the promise
                ret.value.then(iterate);
            }
            // immediate value: just send right back in
            else {
                // avoid synchronous recursion
                setTimeout(function() {
                    iterate(ret.value);
                }, 0);
            }
        }
    })();
}

//function to control the generator
let queryArray = makeApiArray();

//====================RUN THE PROGRAM....IMPORT DATA AND WRITE TO DB============================

let con = mysql.createConnection(sqlDetails);

con.connect(function(err, callback) {

    runGenerator(requestGenerator);

});

const fs = require("fs");
const mysql = require("mysql")
const request = require("request");
let appKey ='q9kxwxqjayeqmqwg3ffphupa';
let FILE = 'Filer_List.csv';
const totalFields = 4233;
const limit = 999;
let apiRuns = Math.ceil(totalFields / limit);
let offset = 0;
let filerID = 101344;
let queryStrings = [];

//Returns all the data about the Owner. (same as the attached Text File)
let filerIDURL = 'http://edgaronline.api.mashery.com/v2/ownerships/owners?filerids='+filerID+'&debug=false&sortby=filerid+asc&appkey='+appKey;

//================================CONNECT TO DB===================================================================
const DB = 'fund_holdings';
const TABLE = 'thirteen_f';
const PASS = 'MGoblue3!';

let con = mysql.createConnection({

    host: 'localhost',
    port: 3306,
    user: 'root',
    password: PASS,
    database: DB

});

//================================FUNCTIONS========================================================================


//import list of filer IDs and create a series of api query strings
const importFilerIDs = (file) => {

    let idList = fs.readFileSync(FILE, 'utf-8');
    //convert to array and make query strings
    idList = idList.split('\r');

    makeApiArray(idList);

}

//makes api query strings based on filer ids provided
const makeApiArray = (idArr) => {

    let url = '';

    for (let i = 0; i < idArr.length; i++) {

        let id = idArr[i].substring(1);
        //Returns all the current holdings for the FilerID...change filer ids..
        //For Example 135 is AccountID for BANCORPSOUTH INC
        let url = 'http://edgaronline.api.mashery.com/v2/ownerships/currentownerholdings?filerids='+id+'&debug=false&sortby=filerid+asc&appkey='+appKey;

        queryStrings.push(url);
    }

    //last string shows up blank - pop it off
    queryStrings.pop();

}

const dataCapture = (url) => {

  return new Promise((resolve, reject) => {
  request(url, (error, response, body) => {

			if (error) {
				reject(error);
			}
			else {
				console.log('getting data..');
				let output = JSON.parse(body);

        if (output['result'] !== undefined) {

              let current = output['result']['rows'];

				//cycle throw embeded objects within the array
				current.forEach((cur, ind) =>{

					let filer, owner, company, ticker, shares, percent = '';
					let data = cur['values'];

						//and then cycle throw the nested array to capture values of interest
						data.forEach((cur, ind) => {

							let test = cur['field'];

							if (test === 'filerid') filer = cur['value'];
							if (test === 'ownername') owner = cur['value'];
							if (test === 'companyname') company = cur['value'];
							if (test === 'ticker') ticker = cur['value'];
							if (test === 'sharesout') shares = (cur['value'] == undefined) ? 0 : cur['value'];
							if (test === 'sharesoutpercent') percent = cur['value'];

						});
    let uploadObject = {
            filer: filer,
            owner: owner,
            company: company,
            ticker: ticker,
            shares: shares,
            percent_owned: percent
        };
        let values = '(' + filer + ', "'+ owner + '", "' + company + '", "' + ticker + '", "' + shares + '", "' + percent + '")';
        console.log(values);

		//update the db..
		con.query('insert into thirteen_f (filer,owner,company,ticker,shares,percent_owned) values ' + values +';', function(err, res) {
            //if (err) console.log(err);
            if (err) {
              throw err;
            } else {
            console.log("Your input was successful!");
          }
        });


				});

        resolve('Completed upload');

			}
    }
    resolve('Skipped a blank entry');

		})
  })
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

  function *requestGenerator () {

  	for (let i = 0; i < queryStrings.length; i++){

      data = '';
  		data = yield dataCapture(queryStrings[i]);
  		console.log('received data for yield ' + i);
  		console.log(data);

  	}

  }


  //================================Import filer IDs===============================================================
  importFilerIDs(FILE);

  //===============================RUN THE PROGRAM=================================================================

  con.connect((err) => {

      if (err) throw err;

      runGenerator(requestGenerator);

  });

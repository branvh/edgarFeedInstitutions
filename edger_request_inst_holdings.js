const fs = require("fs");
const mysql = require("mysql")
const request = require("request");
let appKey ='q9kxwxqjayeqmqwg3ffphupa';
let FILE = 'sampleHoldings.csv';
const totalFields = 4233;
const limit = 999;
let apiRuns = Math.ceil(totalFields / limit);
let offset = 0;
let filerID = 101344;

//Returns all the data about the Owner. (same as the attached Text File)
let filerIDURL = 'http://edgaronline.api.mashery.com/v2/ownerships/owners?filerids='+filerID+'&debug=false&sortby=filerid+asc&appkey='+appKey;

//Returns all the current holdings for the FilerID...change filer ids..
//For Example 135 is AccountID for BANCORPSOUTH INC
let holdingsByFilerURL = 'http://edgaronline.api.mashery.com/v2/ownerships/currentownerholdings?filerids='+filerID+'&debug=false&sortby=filerid+asc&appkey='+appKey;

//================================CONNECT TO DB===================================================================
const DB = 'fund_holdings';
const TABLE = 'thirteen_f';
const PASS = 'lemonkiwi958';

let con = mysql.createConnection({

    host: 'localhost',
    port: 3306,
    user: 'root',
    password: PASS,
    database: DB

});

con.connect((err) => {

    if (err) throw err;

});

//================================FUNCTIONS========================================================================



request(holdingsByFilerURL, (error, response, body) => {

			if (error) {
				throw (error);
			}
			else {
				console.log('getting data..');
				let output = JSON.parse(body);
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
							if (test === 'sharesout') shares = cur['value'];
							if (test === 'sharesoutpercent') percent = cur['value'];

						});	
		
		//update the db..
		con.query('insert into thirteen_f set ?', {
            filer: filer,
            owner: owner,
            company: company,
            ticker: ticker,
            shares: shares,
            percent_owned: percent
        }, function(err, res) {
            console.log("Your input was successful!");
        });		

		
				});

			}

		})

//close db connection
con.end();






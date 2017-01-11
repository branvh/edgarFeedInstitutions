const fs = require("fs");
const COMPANY_LIST = '13fList.csv';

let firms = () => {

	return new Promise((resolve, reject) => {
		fs.readFile(COMPANY_LIST, 'utf-8',(err, data) => {

	if (err) reject(err)
	data.replace(/["']/g, "");
	data.replace(/\r?\n|\r/g, ",");
	let output = data.split(',');
	resolve(output);

})

});
}

let firmArray = firms();

firmArray.then((data) => {
		console.log('firms');
	console.log(data);
	console.log('firms');

	console.log(data[7]);
})


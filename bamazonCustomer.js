var mysql = require('mysql');
var inquirer = require('inquirer');

var connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: 'friday',
	database: 'bamazon'
});

beginTransaction();

function beginTransaction() {
	connection.query(`SELECT * FROM products`, function(err, result) {
		if (err) console.log(err);
		result.forEach(printItem, this);
		getInput(result.length);
	});
}

function printItem(item) {
	let str = ``;
	Object.getOwnPropertyNames(item).forEach(function(value) {
		str += `${value}: ${item[value]} | `;
	}, this);
	console.log(str);
}

function getInput(numChoices) {
	inquirer.prompt([
	{
		type: 'input',
		name: 'productId',
		message: 'Enter the item ID you would like to purchase',
		validate: function(value) {
			let pass = value.match(/\d+/i) && value >= 1 && value <= numChoices;
			if (pass) return true;
			return 'Enter an item ID';
		}
	},
	{
		type: 'input',
		name: 'quantity',
		message: 'Enter the quantity you would like to purchase',
		validate: function(value) {
			let pass = value.match(/\d+/i) && value >= 1;
			if (pass) return true;
			return 'Enter a valid quantity';
		}
	}]).then(function(answer) {
		purchaseItem(answer.productId, answer.quantity);
	});
}

function purchaseItem(productId, quantity) {
	connection.query(`SELECT * FROM products WHERE item_id = ${productId}`, function(err, result) {
		if (err) console.log(err);
		// console.log(result[0]);
		if (result[0].stock_quantity >= quantity) {
			console.log(`Great, we have enough ${result[0].product_name} in stock to fulfill your order.`);
			let stockLevel = result[0].stock_quantity - quantity;
			//tired of call backs, trying a promise
			updateStock(productId, stockLevel)
				.then(function() {
					// console.log("Successfully updated stock");
					console.log(`The total price for ${quantity} ${result[0].product_name} is \$${result[0].price * quantity}.`);
					connection.end();
				})
				.catch(function(err) {
					console.log(err);
					connection.end();
				});
		}
		else {
			console.log(`Sorry, we don't have enough ${result[0].product_name} in stock to fulfill your order.`);
			connection.end();
		}
	});
}

//try a promise
function updateStock(productId, stockLevel) {
	return new Promise(function(resolve, reject) {
		connection.query(`UPDATE products SET stock_quantity = ${stockLevel} WHERE item_id = ${productId}`, function(err, result) {
			if (err) {
				// console.log(err);
				reject(err);
			}
			resolve(result);
		});
	});
}

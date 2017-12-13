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
	// let str = ``;
	// Object.getOwnPropertyNames(obj).forEach(function(value) {
	// 	str += `${value}: ${obj[value]} | `;
	// }, this);
	console.log(`ID: ${item.item_id}; ${item.product_name}; ${item.department_name}; \$${item.price}; Quantity: ${item.stock_quantity}`);
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
			//trying a promise - Sunday at noon
			//Update for Sunday evening in the middle of second whiskey, i realized that if i don't use the returned value
			//that there really was no reason to use a promise. i'm just using the promise to make my code appear synchronous;
			//the work is being done by a side effect. le sigh.
			updateStock(productId, stockLevel)
				.then(function() {
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
				reject(err);
			}
			resolve(result);
		});
	});
}

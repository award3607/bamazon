var mysql = require('mysql');
var inquirer = require('inquirer');

var connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: 'friday',
	database: 'bamazon'
});

getInput();

function getInput() {
	inquirer.prompt([
		{
			type: 'rawlist',
			name: 'choice',
			message: 'Select an action',
			choices: [
				'View products for sale',
				'View low inventory',
				'Add to inventory',
				'Add new product'
			]
		}
	]).then(function(answer) {
		switch(answer.choice) {
			case 'View products for sale':
				displayProducts();
				break;
			case 'View low inventory':
				displayLowInventory();
				break;
			case 'Update product inventory':
				updateInventory();
				break;
			case 'Add new product':
				addProduct();
				break;
			default:
				console.log('Error: Invalid selection');
		}
	});
}

function dbQueryPrint(query) {
	connection.query(query, function(err, result) {
		if (err) console.log(err);
		result.forEach(function(item) {
			console.log(`ID: ${item.item_id}; ${item.product_name}; ${item.department_name}; \$${item.price}; Quantity: ${item.stock_quantity}`);
		}, this);
		connection.end();
	});
}

function dbQuery(query) {
	return new Promise(function(resolve, reject) {
		connection.query(query, function(err, result) {
			if (err) {
				connection.end();
				reject(err);
			}
			resolve(result);
		});
	});
}

function buildChoicesArray() {
	let query = 'SELECT * FROM products';
	return dbQuery(query).then(arrOfItems);
}

function arrOfItems(result) {
	let arr = [];
	result.forEach(function(item) {
		let str = `ID: ${item.item_id}; ${item.product_name}; Quantity: ${item.stock_quantity}`;
		arr.push(str);
	});
	return arr;
}

function printResult(result) {
	result.forEach(function(item) {
			console.log(`ID: ${item.item_id}; ${item.product_name}; ${item.department_name}; \$${item.price}; Quantity: ${item.stock_quantity}`);
		}, this);
	connection.end();
}

function displayProducts() {
	let query = 'SELECT * FROM products';
	// dbQueryPrint(query);
	dbQuery(query).then(printResult);
}

function displayLowInventory() {
	let query = 'SELECT * FROM products WHERE stock_quantity < 5';
	dbQuery(query).then(printResult);
}

function updateInventory() {
	inquirer.prompt([
		{
			type: 'list',
			name: 'choice',
			message: 'Select an item to update its inventory',
			choices: buildChoicesArray
		},
		{
			type: 'input',
			name: 'newQuantity',
			message: 'Enter the new quantity',
			validate: function(value) {
				let pass = value.match(/\d+/i) && value > -1;
				if (pass) return true;
				return 'Enter a valid quantity';
			}
		}
	]).then(function(answer) {
		let itemId = answer.choice.match(/ID: (\d+)/i)[1];
		let query = `UPDATE products SET stock_quantity = ${answer.newQuantity} WHERE item_id = ${itemId}`;
		dbQuery(query).then(function() {
			console.log('Inventory updated');
			connection.end();
		});
	});
}

function addProduct() {
	inquirer.prompt([
		{
			type: 'input',
			name: 'name',
			message: "Enter the product's name",
			validate: function(value) {
				let pass = value.length > 0;
				if (pass) return true;
				return 'Enter a valid product name';
			}
		},
		{
			type: 'input',
			name: 'department',
			message: "Enter the item's department",
			validate: function(value) {
				let pass = value.length > 0;
				if (pass) return true;
				return 'Enter a valid department name';
			}
		},
		{
			type: 'input',
			name: 'price',
			message: "Enter the item's price",
			filter: function(value) {
				return parseFloat(value);
			},
			validate: function(value) {
				let pass = value > 0;
				if (pass) return true;
				return 'Enter a valid price';
			}
		},
		{
			type: 'input',
			name: 'quantity',
			message: "Enter the item's initial stock quantity",
			filter: function(value) {
				return parseInt(value);
			},
			validate: function(value) {
				let pass = value >= 0;
				if (pass) return true;
				return 'Enter a valid initial stock quantity';
			}
		}
	]).then(function(answer) {
		console.log(answer);
		let query = `INSERT INTO products SET product_name = "${answer.name}", department_name = "${answer.department}", price = ${answer.price}, stock_quantity = ${answer.quantity}`;
		dbQuery(query).then(function() {
			console.log('New product added');
			connection.end();
		});
	});
}
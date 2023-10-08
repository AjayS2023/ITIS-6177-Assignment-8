const express = require('express');
const app = express();
const port = 3000;

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const axios = require('axios');

const pool = mariadb.createPool({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'sample',
	port: 3306,
	connectionLimit: 5
});


const options = {
	swaggerDefinition: {
		info: {
			title: 'REST-like API',
			version: '1.0.0',
			description: 'This API works with Swagger to develope API documentation.'
		},
		host: '24.199.80.233:3000',
		basePath: '/',
	},
	apis: ['./server.js']
};

const specs = swaggerJSDoc(options);
app.use('/docs', swaggerUI.serve, swaggerUI.setup(specs));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// I used these links from the mariadb documentation to help me with this: 
// https://mariadb.com/docs/xpand/connect/programming-languages/nodejs/promise/connection-pools/ 
// https://mariadb.com/docs/skysql-previous-release/connect/programming-languages/nodejs/promise/development/ 
// https://mariadb.com/docs/xpand/connect/programming-languages/nodejs/promise/connect/

app.get('/', (req, res) => {
	res.send('Hi, my name is Ajay Shankar. Welcome to this REST-like API application.');
});

/**
 * @swagger
 * /foods:
 *    get:
 *      description: Returns details of all foods in the database
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Returns details of foods
 */
app.get('/foods', (req, res) => {
	pool.getConnection()
		.then(connection => {
			// uses SQL query to get information from database
			connection.query('SELECT * FROM foods')
				// if query works, the connection is ended, the header of the result page is set and result is returned
				// I used this link to help make the JSON look better: https://www.w3schools.com/jsref/jsref_stringify.asp
				.then(rows => {
					connection.end();
					const formattedJSON = JSON.stringify(rows, null, 3);
					res.setHeader('Content-Type', 'application/json');
					res.end(formattedJSON);

				})
				// if query does not work, the connection is ended and the error message is sent to the page
				.catch(err => {
					connection.end();
					console.log(err + 'The query to get the food information did not work');
				});
		})
		// if database is not connected, an error is returned
		.catch(err => console.log(err));
});

// Used https://editor.swagger.io/ as inspiration
/**
 * @swagger
 * /foods:
 *    post:
 *      description: Creates a new food 
 *      produces:
 *          - application/json
 *      parameters:
 *        - name: ITEM_ID
 *          description: ID of the food
 *          required: true
 *          type: string
 *        - name: ITEM_NAME
 *          description: Name of the food
 *          required: true
 *          type: string
 *        - name: ITEM_UNIT
 *          description: Food's unit of measure (up to 5 characters)
 *          required: true
 *          type: string
 *        - name: COMPANY_ID
 *          description: ID of the company that made the food
 *          required: true
 *          type: string
 *      responses:
 *          '201':
 *              description: New food was successfully created
 *          '404':
 *              description: Food could not be created
 */
app.post('/foods', (req, res) => {
	// gets food attributes from request body
	const { ITEM_ID, ITEM_NAME, ITEM_UNIT, COMPANY_ID } = req.body;

	pool.getConnection()
		.then(connection => {
			// adds new food into database
			connection.query('INSERT INTO foods(ITEM_ID, ITEM_NAME, ITEM_UNIT, COMPANY_ID) VALUES (?, ?, ?, ?)', [ITEM_ID, ITEM_NAME, ITEM_UNIT, COMPANY_ID])
				// if addition of food into database is successful, connection is ended
				.then(rows => {
					connection.end();
				})
				.catch(err => {
					connection.end();
					console.log(err);
				})
		})
		.catch(err => console.log(err));
});

/**
 * @swagger
 * /foods/{ITEM_ID}:
 *   put:
 *     description: Updates a specfic food using its ITEM_ID
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: ITEM_ID
 *         in: path
 *         description: Food item's id to be updated
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: Food was updated successfully
 *       '404':
 *         description: The food with the id ITEM_ID was not found. 
 */
app.put('/foods/:ITEM_ID', (req, res) => {
	const { ITEM_ID } = req.params;
	const { ITEM_NAME, ITEM_UNIT, COMPANY_ID } = req.body;

	pool.getConnection()
		.then(connection => {
			// updates existing food according to parameter
			connection.query('UPDATE foods SET ITEM_NAME = ?, ITEM_UNIT = ?, COMPANY_ID = ? WHERE ITEM_ID = ?', [ITEM_NAME, ITEM_UNIT, COMPANY_ID, ITEM_ID])
				// if food is updated, connection is ended
				.then(result => {
					connection.end();
				})
				.catch(err => {
					connection.end();
					console.error(err);
				});
		})
		.catch(err = console.log(err));
});

/**
 * @swagger
 * /foods/{ITEM_ID}:
 *   delete:
 *     description: Removes a specific food by using its ITEM_ID
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: ITEM_ID
 *         in: path
 *         description: The ID of the food item that will be deleted
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: Food was deleted successfully
 *       '404':
 *         description: Could not find food to delete
 */
app.delete('/foods/:ITEM_ID', (req, res) => {
	const { ITEM_ID } = req.params;

	pool.getConnection()
		.then(connection => {
			// if food is deleted, connection is ended
			connection.query('DELETE FROM foods WHERE ITEM_ID = ?', [ITEM_ID])
				.then(rows => {
					connection.end();
				})
				.catch(err => {
					connection.end();
					console.log(err);
				});
		})
		.catch(err => console.log(err));

});

app.get('/say', (req, res) => {
	const { keyword } = req.query;

	// Check if a keyword is provided
	if (!keyword) {
		res.status(400);
		res.send("There is no keyword. Please put in a keyword.");
		return;
	}

	// sends the keyword to the user 
	res.send(`Ajay says ${keyword}.`);
});

/**
 * @swagger
 * /companies:
 *    get:
 *      description: Returns details of all companies in the database
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Returns details of companies 
 */
app.get('/companies', (req, res) => {
	pool.getConnection()
		.then(connection => {
			connection.query('SELECT * FROM company')
				.then(rows => {
					connection.end();
					const formattedJSON = JSON.stringify(rows, null, 3);
					res.setHeader('Content-Type', 'application/json');
					res.end(formattedJSON);
				})
				.catch(err => {
					connection.end();
					console.log(err + 'The query to get the companies did not work.');
				})
		})
		.catch(err => console.log(err));
});

/**
 * @swagger
 * /companies:
 *    post:
 *      description: Creates a new company
 *      produces:
 *          - application/json
 *      parameters:
 *        - name: COMPANY_ID
 *          description: ID of the company
 *          required: true
 *          type: string
 *        - name: COMPANY_NAME
 *          description: Name of the company
 *          required: true
 *          type: string
 *        - name: COMPANY_CITY
 *          description: City of the company
 *          required: true
 *          type: string
 *      responses:
 *          '201':
 *              description: New company was successfully created
 *          '404':
 *              description: Company could not be created
 */
app.post('/companies', (req, res) => {
	// gets company attributes from request body
	const { COMPANY_ID, COMPANY_NAME, COMPANY_CITY } = req.body;

	pool.getConnection()
		.then(connection => {
			// adds new company into database
			connection.query('INSERT INTO company(COMPANY_ID, COMPANY_NAME, COMPANY_CITY) VALUES (?, ?, ?)', [COMPANY_ID, COMPANY_NAME, COMPANY_CITY])
				// if addition of company into database is successful, connection is ended
				.then(rows => {
					connection.end();
				})
				.catch(err => {
					connection.end();
					console.log(err);
				})
		})
		.catch(err => console.log(err));
});

/**
 * @swagger
 * /students:
 *    get:
 *      description: Returns details of all students in database
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Returns details of students
 */
app.get('/students', (req, res) => {
	pool.getConnection()
		.then(connection => {
			connection.query('SELECT * FROM student')
				.then(rows => {
					connection.end();
					const formattedJSON = JSON.stringify(rows, null, 3);
					res.setHeader('Content-Type', 'application/json');
					res.end(formattedJSON);
				})
				.catch(err => {
					connection.end();
					console.log(err + 'The query to get the students information did not work.')
				})
		})
		.catch(err => console.log(err));
});

/**
 * @swagger
 * /students:
 *    post:
 *      description: Creates a new student
 *      produces:
 *          - application/json
 *      parameters:
 *        - name: NAME
 *          description: First name of the student
 *          required: true
 *          type: string
 *        - name: TITLE
 *          description: Last name of the student
 *          required: true
 *          type: string
 *        - name: CLASS
 *          description: Grade student is in
 *          required: true
 *          type: string
 * 		  - name: SECTION
 * 			description: Class section they are in (one character)
 * 			required: true
 * 			type: string
 * 		  - name: ROLLID
 * 			description: Student's ID
 * 			required: true
 * 			type: string
 *      responses:
 *          '201':
 *              description: New student was successfully created
 *          '404':
 *              description: Student could not be created
 */
app.post('/students', (req, res) => {
	// gets student attributes from request body
	const { NAME, TITLE, CLASS, SECTION, ROLLID } = req.body;

	pool.getConnection()
		.then(connection => {
			// adds new student into database
			connection.query('INSERT INTO student(NAME, TITLE, CLASS, SECTION, ROLLID) VALUES (?, ?, ?, ?, ?)', [NAME, TITLE, CLASS, SECTION, ROLLID])
				// if addition of student into database is successful, connection is ended
				.then(rows => {
					connection.end();
				})
				.catch(err => {
					connection.end();
					console.log(err);
				})
		})
		.catch(err => console.log(err));
});

app.get('/say', async (req, res) => {
	const { keyword } = req.query;

	// this attempts to get data from the function in the cloud
	try {
		const response = await axios.get(`https://jbnr19r7ni.execute-api.us-east-1.amazonaws.com/new/say?keyword=${keyword}`);
		res.status(response.status);
		res.send(response.data);
	} catch (error) {
		res.status(500);
		res.send('There is an internal server error');
	}

});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});

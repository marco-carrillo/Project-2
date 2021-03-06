// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");

module.exports = function(app) {
  //***************************************************************************/
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  //***************************************************************************/
  app.post("/api/login", passport.authenticate("local"), function(req, res) {
    res.json(req.user);
  });

  //*****************************************************************************************************************/
  // Route for signing up a user. The user's password is automatically hashed and stored securely thanks to
  // how we configured our Sequelize User Model. If the user is created successfully, proceed to log the user in,
  // otherwise send back an error
  //*****************************************************************************************************************/
  app.post("/api/signup", function(req, res) {
    db.User.create({
      email: req.body.email,
      password: req.body.password
    })
      .then(function() {
        res.redirect(307, "/api/login");
      })
      .catch(function(err) {
        res.status(401).json(err);
      });
  });

  //********************************/
  // Route for creating a new user
  //********************************/
  app.post("/api/createuser", function(req, res){
  db.User.create(req.body).then (function(dbUser){
    res.status(200).json({});

    }).catch(function(error){
      console.log(error);
      console.log('going through the catch route');
      res.status(401).json(error);
      });
  });

//********************************************/
//  The following route creates a new order  */
//  and then returns the number of the order */
//********************************************/
app.post("/api/createOrder", (req, res) =>{
  db.Order.create(req.body).then (function(order){
    res.status(200).json(order);
  })
});

//**************************************************/
//  The following route creates a new order detail */
//  and then returns the number of the order       */
//**************************************************/
app.post("/api/createOrderDetail", (req, res) =>{
  db.Order_detail.create(req.body).then (function(order){
    res.status(200).json(order);
  })
});

//*******************************************************/
//  The following route updates a table ID to occupied  */
//*******************************************************/
app.post("/api/occupyTable",(req,res)=>{
  let sql=`UPDATE Tables SET occupied=${req.body.occupied} WHERE id=${req.body.id}`
  db.sequelize.query(sql).then(tables => {res.status(200).json(tables);});
});

//*******************************************************/
//  The following route changes the status of an order  */
//*******************************************************/
app.post("/api/changeOrderStatus",(req,res)=>{
  let sql=`UPDATE Orders SET status_id=${req.body.status_id} WHERE id=${req.body.id}`
  db.sequelize.query(sql).then(orderStatus => {res.status(200).json({});});
});

//*******************************************************************************/
//  The following route returns information about all of the tables, and their  */
//  associated order(if available).                                             */
//*******************************************************************************/
app.get("/api/allTablesInfo",(req,res)=>{
  let sql='SELECT t.id AS table_id,t.name AS table_name,t.occupied AS table_occupied, '+
          'o.customer_name AS customer_name,o.total_bill AS total_bill, os.name AS order_status '+
          'FROM Tables t '+
          'LEFT JOIN Orders o ON o.table_id=t.id '+
          'LEFT JOIN Order_statuses os ON os.id=o.status_id;';
  db.sequelize.query(sql).then(tables => {res.status(200).json(tables);});
});

//****************************************************************************/
//  The following route returns information about an order ID passed         */
//  plus all of its details                                                  */
//****************************************************************************/
app.post("/api/orderDetails",(req,res)=>{
  let sql='SELECT o.id, o.customer_name,t.name as tables,s.name as status,o.total_bill, '+
          'TIME(o.createdAt) as ordered,m.id as meal_id, m.name as meal,d.quantity,d.total as item_total '+
          'FROM Orders o '+
          'LEFT JOIN Tables t on t.id=o.table_id '+
          'LEFT JOIN Order_statuses s on s.id=o.status_id '+
          'LEFT JOIN Order_details d on d.order_id=o.id '+
          'LEFT JOIN Meals m on m.id=d.meal_id '+
          `WHERE o.id=${req.body.id};`
  db.sequelize.query(sql).then(orderDetails => {res.status(200).json(orderDetails);});
});

//*****************************************************************************/
//  The following route returns today's sales consolidated by type of food    */
//  (main course, wines, coffee, water, etc.) and by meal (steak, etc.)       */
//*****************************************************************************/
app.get("/api/salesToday",(req,res)=>{

  let sql='SELECT mt.id as category_id,mt.name as category,m.id as meal_id,m.name as meal,SUM(total) as meals_total '+
          'FROM Order_details od '+
          'LEFT JOIN Meals m on m.id=od.meal_id '+
          'LEFT JOIN Meal_types mt on mt.id=m.meal_type_id '+
          // 'WHERE DATE(od.createdAt)=CURDATE() '+ 
          'GROUP BY category_id,category,meal_id,meal '+
          'ORDER BY category_id,category,meal_id,meal;'
  db.sequelize.query(sql).then(orders => {res.status(200).json(orders);});
});

//*******************************************************************************/
//  The following route returns information about all of the orders that        */
//  need to be prepared by the kitchen                                          */
//*******************************************************************************/
app.get("/api/kitchenOrders",(req,res)=>{
    let sql='SELECT o.id, o.customer_name,t.name as tables,s.name as status,o.total_bill,TIME(o.createdAt) as ordered '+
            'FROM Orders o '+
            'LEFT JOIN Tables t on t.id=o.table_id '+
            'LEFT JOIN Order_statuses s on s.id=o.status_id '+
            'WHERE o.status_id<3 '+
            'ORDER BY o.createdAt ASC;'
    db.sequelize.query(sql).then(orders => {res.status(200).json(orders);});
});

//*******************************************************************************/
//  The following route returns information about all of the orders that        */
//  need to be prepared by the kitchen                                          */
//*******************************************************************************/
app.get("/api/readyOrders",(req,res)=>{
  let sql='SELECT o.id, o.customer_name,t.name as tables,s.name as status,o.total_bill,TIME(o.createdAt) as ordered '+
          'FROM Orders o '+
          'LEFT JOIN Tables t on t.id=o.table_id '+
          'LEFT JOIN Order_statuses s on s.id=o.status_id '+
          'WHERE o.status_id=3 '+
          'ORDER BY o.createdAt ASC;'
  db.sequelize.query(sql).then(orders => {res.status(200).json(orders);});
});

//*******************************************************************************/
//  The following route returns information about all of the orders that        */
//  need to be prepared by the kitchen                                          */
//*******************************************************************************/
app.get("/api/servedOrders",(req,res)=>{
  let sql='SELECT o.id, o.customer_name,t.name as tables,s.name as status,o.total_bill,TIME(o.createdAt) as ordered '+
          'FROM Orders o '+
          'LEFT JOIN Tables t on t.id=o.table_id '+
          'LEFT JOIN Order_statuses s on s.id=o.status_id '+
          'WHERE o.status_id=4 '+
          'ORDER BY o.createdAt ASC;'
  db.sequelize.query(sql).then(orders => {res.status(200).json(orders);});
});

//********************************************************************************/
//  The following route returns sales per hour (1 row per hour with the number)  */
//  of sales and the total amount sold per hour.                                 */
//********************************************************************************/
app.get("/api/salesByHour",(req,res)=>{
  let sql='SELECT HOUR(o.updatedAt) AS hour,COUNT(*) AS nOrders, SUM(o.total_bill) AS hSales '+
          'FROM Orders o '+
          'LEFT JOIN Order_statuses os ON os.id=o.status_id '+
          'GROUP BY HOUR(o.updatedAt) '+
          'ORDER BY HOUR(o.updatedAt) ASC;';
  db.sequelize.query(sql).then(sales => {res.status(200).json(sales);});
});

//*****************************************************************************/
//  The following route returns all tables that are available (not occupied)  */
//*****************************************************************************/
app.get("/api/tablesAvailable",(req,res)=>{
  let sql='SELECT name, id ' +
          'FROM Tables ' +
          'WHERE occupied=false '+
          'ORDER BY id ASC ;'
  db.sequelize.query(sql).then(tables => {res.status(200).json(tables);});
});

//*******************************************************************************/
//  The following route returns the full menu, marked by the manager as active  */
//  Only items by the manager will be returned.  Also, it will return the order */
//  for it to be presented in the menu, and the type of item.                   */
//*******************************************************************************/
app.get("/api/menu",(req,res)=>{
  let sql='SELECT t.name as type, m.id,m.name,m.price,t.menu_order '+
          'FROM Meals m '+
          'LEFT JOIN Meal_types t on t.id=m.meal_type_id '+
          'WHERE active=1 '+
          'ORDER BY t.menu_order ASC, m.price DESC ';
  db.sequelize.query(sql).then(menu => {res.status(200).json(menu);});
});

//*******************************************************/
//  Following route creates a record on the meals table
//*******************************************************/
app.post("/api/createmeal", function(req, res){
  db.Meal.create(req.body).then (function(dbMeal){
    res.status(200).json({});

    }).catch(function(error){
      console.log(error);
      console.log('going through the catch route');
      res.status(401).json(error);
      });
  });

//***************************************/
//  The following route logs users out  */
//  associated order(if available).     */
//***************************************/
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", function(req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.email,
        id: req.user.id
      });
    }
  });
};

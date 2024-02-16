
import mysql from 'mysql2';



const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cactus',
   
});



pool.getConnection((error, connection) => {
    if (error) {
        console.error('เกิดข้อผิดพลาดในการเชื่อมต่อ:', error);
        return;
    }
    console.log("successfull");
    

});


//     connection.query('SELECT * FROM customers', (error, results, fields) => {
//         connection.release(); // ปล่อย connection ให้กับ pool

//         if (error) {
//             console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
//             return;
//         }
//         console.log('ข้อมูลที่ได้:', results);
//     });